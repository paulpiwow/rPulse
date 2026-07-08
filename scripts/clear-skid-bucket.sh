#!/usr/bin/env bash
# Wipe the skid bucket for a fresh demo run.
#
# Drops the whole database on the chosen Influx (both skid_measurement and
# skid_computedTag_measurement go with it). InfluxDB 3 auto-creates the
# database on the next write, so no re-provisioning is needed — restart the
# simulator and data starts flowing into a clean bucket.
#
# This is deliberately a standalone admin script, not a backend endpoint:
# the rPulse connector is read-only by design (docs/influx-connector.md).
#
# Usage:
#   scripts/clear-skid-bucket.sh [local|rtruth] [-y]
#
#   local  (default) rPulse's own Influx on http://127.0.0.1:8188
#   rtruth           rTruth's Influx on http://127.0.0.1:8087
#   -y               skip the confirmation prompt
#
# Overrides (win over the mode's defaults):
#   RPULSE_INFLUX_URL       full base URL, host-reachable
#   RPULSE_INFLUX_DATABASE  database name        (default: skid_bucket)
#   RPULSE_INFLUX_TOKEN     bearer token, if auth is enabled
set -euo pipefail

MODE="local"
ASSUME_YES=false
for arg in "$@"; do
  case "$arg" in
    local|rtruth) MODE="$arg" ;;
    -y|--yes)     ASSUME_YES=true ;;
    -h|--help)    sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown argument: $arg (try --help)" >&2; exit 1 ;;
  esac
done

if [[ "$MODE" == "rtruth" ]]; then
  DEFAULT_URL="http://127.0.0.1:8087"
else
  DEFAULT_URL="http://127.0.0.1:8188"
fi
URL="${RPULSE_INFLUX_URL:-$DEFAULT_URL}"
DB="${RPULSE_INFLUX_DATABASE:-skid_bucket}"
TOKEN="${RPULSE_INFLUX_TOKEN:-}"

AUTH_ARGS=()
if [[ -n "$TOKEN" ]]; then
  AUTH_ARGS=(-H "Authorization: Bearer $TOKEN")
fi

if ! $ASSUME_YES; then
  read -r -p "Delete database '$DB' on $URL ($MODE mode)? [y/N] " reply
  case "$reply" in
    y|Y|yes|YES) ;;
    *) echo "aborted."; exit 1 ;;
  esac
fi

BODY_FILE=$(mktemp)
trap 'rm -f "$BODY_FILE"' EXIT

# ${arr[@]+...} keeps macOS bash 3.2 happy: plain "${AUTH_ARGS[@]}" on an
# empty array trips `set -u` there.
STATUS=$(curl -s -o "$BODY_FILE" -w "%{http_code}" -X DELETE \
  ${AUTH_ARGS[@]+"${AUTH_ARGS[@]}"} \
  "$URL/api/v3/configure/database?db=$DB") || {
  echo "error: could not reach Influx at $URL — is the container running?" >&2
  exit 1
}

case "$STATUS" in
  200|204)
    echo "cleared: database '$DB' deleted on $URL."
    echo "It will be recreated automatically on the next write."
    ;;
  404)
    echo "nothing to clear: database '$DB' does not exist on $URL."
    ;;
  401|403)
    echo "error: Influx rejected the request ($STATUS) — set RPULSE_INFLUX_TOKEN." >&2
    exit 1
    ;;
  *)
    echo "error: unexpected HTTP $STATUS from Influx:" >&2
    cat "$BODY_FILE" >&2
    exit 1
    ;;
esac
