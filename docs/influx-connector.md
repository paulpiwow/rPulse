# rTruth InfluxDB Connector

## Scope

The rPulse Spring Boot backend reads time-series measurements from the rTruth
InfluxDB 3 Core service. rTruth owns ingestion and storage; rPulse owns the API
used by the Vue user interface. The connector is read-only.

## Local topology

```text
Vue UI -> rPulse REST API -> rTruth InfluxDB 3
```

rTruth publishes InfluxDB container port `8181` on host port `8087`. Because
rPulse and rTruth run in separate Docker Compose projects, the rPulse backend
uses `http://host.docker.internal:8087` in Docker. A Spring Boot process running
directly on the host defaults to `http://127.0.0.1:8087`.

## Configuration

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `RPULSE_INFLUX_URL` | `http://127.0.0.1:8087` | InfluxDB 3 base URL |
| `RPULSE_INFLUX_DATABASE` | `raw_bucket` | rTruth database |
| `RPULSE_INFLUX_TOKEN` | empty | Optional bearer token |
| `RPULSE_INFLUX_CONNECT_TIMEOUT` | `3s` | Connection timeout |
| `RPULSE_INFLUX_READ_TIMEOUT` | `10s` | Query timeout |

rTruth currently runs with authentication disabled for local development. The
token setting is present so deployment can enable authentication without a code
change.

## REST API

### Connector health

`GET /api/telemetry/health`

Returns HTTP 200 when rTruth responds to its health endpoint and HTTP 503 when
it cannot be reached.

### Latest readings

`GET /api/telemetry/readings/latest`

Optional query parameters are `siteName`, `lineName`, `assetName`, `tagName`,
and `limit`. The limit defaults to 100 and must be between 1 and 500. Filter
values are sent to InfluxDB as SQL parameters rather than concatenated into the
query.

The endpoint returns rows from `raw_bucket.raw_measurement`, newest first.
InfluxDB failures are returned as HTTP 502 responses.
