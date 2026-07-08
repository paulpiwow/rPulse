# InfluxDB Connector

## Scope

The rPulse Spring Boot backend reads time-series measurements from an InfluxDB 3
Core service. The destination is switchable between rTruth's Influx and rPulse's
own local Influx (`rpulse-influx` in this repo's compose stack); both use the
same database and measurement names, so backend queries are identical against
either target.

## Modes and topology

```text
Vue UI -> rPulse REST API -> InfluxDB 3 (local mode: rpulse-influx | rTruth mode: rTruth's Influx)
```

Both modes read `skid_bucket`, which holds two measurements: `skid_measurement`
(raw tags from the skid) and `skid_computedTag_measurement` (CTags computed from
those).

- **Local mode (default)** — rPulse's own `rpulse-influx` service, reachable as
  `rpulse-influx:8181` inside the compose network and `127.0.0.1:8188` from the
  host. Lets rPulse demo standalone, disconnected from rTruth.
- **rTruth mode** — rTruth publishes its Influx container port `8181` on host
  port `8087`. Because rPulse and rTruth run in separate Docker Compose
  projects, the rPulse backend uses `http://host.docker.internal:8087`.

Switch modes with the preset env files at the repo root:

```sh
docker compose --env-file .env.local-influx up   # local mode (same as default)
docker compose --env-file .env.rtruth up         # rTruth mode
```

## Configuration

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `RPULSE_INFLUX_URL` | `http://127.0.0.1:8188` (host) / `http://rpulse-influx:8181` (compose) | InfluxDB 3 base URL |
| `RPULSE_INFLUX_DATABASE` | `skid_bucket` | Influx database |
| `RPULSE_INFLUX_RAW_MEASUREMENT` | `skid_measurement` | Raw tag measurement |
| `RPULSE_INFLUX_CTAG_MEASUREMENT` | `skid_computedTag_measurement` | Computed tag measurement |
| `RPULSE_INFLUX_TOKEN` | empty | Optional bearer token |
| `RPULSE_INFLUX_CONNECT_TIMEOUT` | `3s` | Connection timeout |
| `RPULSE_INFLUX_READ_TIMEOUT` | `10s` | Query timeout |

Both rTruth and the local `rpulse-influx` currently run with authentication
disabled for local development. The token setting is present so deployment can
enable authentication without a code change.

## REST API

### Connector health

`GET /api/telemetry/health`

Returns HTTP 200 when the configured Influx responds to its health endpoint and
HTTP 503 when it cannot be reached.

### Latest readings

`GET /api/telemetry/readings/latest`

Optional query parameters are `siteName`, `lineName`, `assetName`, `tagName`,
and `limit`. The limit defaults to 100 and must be between 1 and 500. Filter
values are sent to InfluxDB as SQL parameters rather than concatenated into the
query.

The endpoint returns rows from `skid_bucket.skid_measurement`, newest first.
InfluxDB failures are returned as HTTP 502 responses.
