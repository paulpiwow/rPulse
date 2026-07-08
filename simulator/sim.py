#!/usr/bin/env python3
"""rPulse skid simulator — stands in for the real compressor skid.

Publishes raw tag values into <database>/<measurement> (skid_bucket /
skid_measurement by default) on whichever Influx the stack is pointed at:
rPulse's own rpulse-influx (local mode) or rTruth's (rTruth mode). It writes
ONLY raw tags — CTags are computed downstream by rPulse and land in
skid_computedTag_measurement.

Per-tag value generation modes (simulator/tags.json):
  ramp   sawtooth: start at min, step up each tick until the value exceeds
         max by SIM_RAMP_OVERSHOOT (40% of the range by default), then reset
         to min and repeat. Drives the "alarm fires, stays fired, clears" demo.
  noisy  uniform random within [min, max] each tick. Drives the "alarm
         chatters on/off" demo when the range straddles a threshold.

Rolling window: on startup the sim asks Influx for the newest existing point
and backfills day-by-day from there (or from SIM_BACKFILL_DAYS ago on an empty
bucket) at SIM_BACKFILL_INTERVAL_SECONDS resolution, then switches to live
ticking. So a fresh demo gets a full trailing window of chart history, and a
restart gap-fills whatever was missed — the window keeps rolling indefinitely.

Configuration (env):
  RPULSE_INFLUX_URL              default http://127.0.0.1:8188
  RPULSE_INFLUX_DATABASE         default skid_bucket
  RPULSE_INFLUX_RAW_MEASUREMENT  default skid_measurement
  RPULSE_INFLUX_TOKEN            optional bearer token
  SIM_INTERVAL_SECONDS           seconds between live ticks, default 5
  SIM_BACKFILL_DAYS              trailing window to populate, default 7 (0 = off)
  SIM_BACKFILL_INTERVAL_SECONDS  historical point spacing, default 60
  SIM_RAMP_OVERSHOOT             ramp peak overshoot fraction, default 0.4
  SIM_SITE_NAME                  siteName tag on every point
  SIM_TAGS_FILE                  tag catalog path, default tags.json beside this file

Flags: --once (single live tick, then exit), --dry-run (print line protocol
instead of writing; also skips backfill). Useful together as a smoke test.
"""

import argparse
import json
import os
import random
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path


def env(name, default):
    value = os.environ.get(name, "")
    return value if value != "" else default


LP_ESCAPES = str.maketrans({",": r"\,", " ": r"\ ", "=": r"\="})


def escape_tag(value):
    """Escape a tag key/value for line protocol."""
    return str(value).translate(LP_ESCAPES)


class Series:
    """One simulated tag and its generation state."""

    def __init__(self, spec, overshoot, rng):
        self.tag_name = spec["tagName"]
        self.asset_name = spec.get("assetName", "")
        self.mode = spec.get("mode", "noisy")
        self.min = float(spec["min"])
        self.max = float(spec["max"])
        self.round = bool(spec.get("round", False))
        self.ramp_steps = int(spec.get("rampSteps", 60))
        self.peak = self.max + overshoot * (self.max - self.min)
        self.step = 0
        self.rng = rng

    def next_value(self):
        if self.mode == "ramp":
            span = self.peak - self.min
            value = self.min + span * self.step / max(self.ramp_steps, 1)
            self.step += 1
            if value >= self.peak:
                self.step = 0  # next tick starts back at min → alarm clears
        else:
            value = self.rng.uniform(self.min, self.max)
        return float(round(value)) if self.round else value


def build_lines(series_list, site_name, measurement, timestamp_ms):
    lines = []
    for series in series_list:
        tags = [f"tagName={escape_tag(series.tag_name)}"]
        if site_name:
            tags.append(f"siteName={escape_tag(site_name)}")
        if series.asset_name:
            tags.append(f"assetName={escape_tag(series.asset_name)}")
        lines.append(
            f"{escape_tag(measurement)},{','.join(sorted(tags))}"
            f" value={series.next_value()} {timestamp_ms}"
        )
    return lines


def write_lines(base_url, database, token, lines):
    url = f"{base_url}/api/v3/write_lp?db={database}&precision=millisecond"
    request = urllib.request.Request(
        url, data="\n".join(lines).encode(), method="POST",
        headers={"Content-Type": "text/plain; charset=utf-8"},
    )
    if token:
        request.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.status


def query_latest_time_ms(base_url, database, token, measurement):
    """Epoch ms of the newest point in the measurement, or None if empty.

    A 404/400 from Influx means the database or table doesn't exist yet
    (Influx 3 creates both on first write) — that's just "empty".
    """
    payload = json.dumps({
        "db": database,
        "q": f"SELECT MAX(time) AS latest FROM {measurement}",
        "format": "json",
    }).encode()
    request = urllib.request.Request(
        f"{base_url}/api/v3/query_sql", data=payload, method="POST",
        headers={"Content-Type": "application/json"},
    )
    if token:
        request.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            rows = json.load(response)
    except urllib.error.HTTPError as error:
        if error.code in (400, 404):
            return None
        raise
    if not rows or not rows[0].get("latest"):
        return None
    from datetime import datetime, timezone
    raw = str(rows[0]["latest"]).replace("Z", "+00:00")
    parsed = datetime.fromisoformat(raw)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return int(parsed.timestamp() * 1000)


BACKFILL_FLUSH_LINES = 20_000


def backfill(series_list, site_name, measurement, start_ms, end_ms, step_ms, flush):
    """Generate history from start_ms to end_ms, flushing in bounded chunks.

    Logs progress day by day so a week-long fill is visible in the container
    logs. Series state (ramp position) carries through into the live loop.
    """
    pending = []
    current_day = None
    day_points = 0
    for ts in range(start_ms, end_ms, step_ms):
        day = time.strftime("%Y-%m-%d", time.gmtime(ts / 1000))
        if day != current_day:
            if current_day is not None:
                print(f"skid-sim: backfilled {current_day} ({day_points} points)", flush=True)
            current_day, day_points = day, 0
        lines = build_lines(series_list, site_name, measurement, ts)
        pending.extend(lines)
        day_points += len(lines)
        if len(pending) >= BACKFILL_FLUSH_LINES:
            flush(pending)
            pending = []
    if pending:
        flush(pending)
    if current_day is not None:
        print(f"skid-sim: backfilled {current_day} ({day_points} points)", flush=True)


def main():
    parser = argparse.ArgumentParser(description="rPulse skid simulator")
    parser.add_argument("--once", action="store_true", help="write one tick and exit")
    parser.add_argument("--dry-run", action="store_true", help="print line protocol instead of writing")
    args = parser.parse_args()

    base_url = env("RPULSE_INFLUX_URL", "http://127.0.0.1:8188").rstrip("/")
    database = env("RPULSE_INFLUX_DATABASE", "skid_bucket")
    measurement = env("RPULSE_INFLUX_RAW_MEASUREMENT", "skid_measurement")
    token = env("RPULSE_INFLUX_TOKEN", "")
    interval = float(env("SIM_INTERVAL_SECONDS", "5"))
    backfill_days = float(env("SIM_BACKFILL_DAYS", "7"))
    backfill_step_ms = int(float(env("SIM_BACKFILL_INTERVAL_SECONDS", "60")) * 1000)
    overshoot = float(env("SIM_RAMP_OVERSHOOT", "0.4"))
    site_name = env("SIM_SITE_NAME", "Cadre Compressor Skid")
    tags_file = Path(env("SIM_TAGS_FILE", str(Path(__file__).parent / "tags.json")))

    rng = random.Random()
    specs = json.loads(tags_file.read_text())["tags"]
    series_list = [Series(spec, overshoot, rng) for spec in specs]
    print(
        f"skid-sim: {len(series_list)} tags -> {base_url} db={database} "
        f"measurement={measurement} every {interval}s",
        flush=True,
    )

    if not args.dry_run and backfill_days > 0:
        # Wait for Influx (compose starts us alongside it), then fill the gap
        # between the newest existing point and now — or the whole trailing
        # window on an empty bucket.
        while True:
            try:
                latest_ms = query_latest_time_ms(base_url, database, token, measurement)
                break
            except (urllib.error.URLError, OSError) as error:
                print(f"skid-sim: waiting for Influx ({error})", file=sys.stderr, flush=True)
                time.sleep(5)
        now_ms = int(time.time() * 1000)
        window_start_ms = now_ms - int(backfill_days * 86_400_000)
        start_ms = window_start_ms if latest_ms is None else max(latest_ms + backfill_step_ms, window_start_ms)
        if start_ms < now_ms:
            print(
                f"skid-sim: backfilling {(now_ms - start_ms) / 86_400_000:.1f} days "
                f"at {backfill_step_ms // 1000}s resolution",
                flush=True,
            )
            backfill(
                series_list, site_name, measurement, start_ms, now_ms, backfill_step_ms,
                lambda lines: write_lines(base_url, database, token, lines),
            )
            print("skid-sim: backfill complete, switching to live ticks", flush=True)
        else:
            print("skid-sim: bucket already current, no backfill needed", flush=True)

    while True:
        lines = build_lines(series_list, site_name, measurement, int(time.time() * 1000))
        if args.dry_run:
            print("\n".join(lines), flush=True)
        else:
            try:
                write_lines(base_url, database, token, lines)
            except (urllib.error.URLError, OSError) as error:
                # Influx down or not up yet — keep ticking, it auto-creates the
                # database once reachable.
                print(f"skid-sim: write failed ({error}), retrying next tick", file=sys.stderr, flush=True)
        if args.once:
            return
        time.sleep(interval)


if __name__ == "__main__":
    main()
