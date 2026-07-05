package com.rpulse.backend.influx;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

final class InfluxHttpSupport {
    private static final ParameterizedTypeReference<List<Map<String, Object>>> ROWS =
            new ParameterizedTypeReference<>() { };
    private InfluxHttpSupport() { }

    static List<Map<String, Object>> query(RestClient client, String database, String sql,
                                           Map<String, Object> parameters) {
        try {
            List<Map<String, Object>> rows = client.post().uri("/api/v3/query_sql")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new QueryRequest(database, sql, parameters, "json"))
                    .retrieve().body(ROWS);
            return rows == null ? List.of() : rows;
        } catch (RestClientException exception) {
            throw new InfluxUnavailableException("Unable to query InfluxDB", exception);
        }
    }

    static void write(RestClient client, String database, String org, String lineProtocol) {
        try {
            client.post().uri(builder -> builder.path("/api/v2/write")
                            .queryParam("org", org).queryParam("bucket", database)
                            .queryParam("precision", "ns").build())
                    .contentType(MediaType.TEXT_PLAIN).body(lineProtocol)
                    .retrieve().toBodilessEntity();
        } catch (RestClientException exception) {
            throw new InfluxUnavailableException("Unable to write to InfluxDB", exception);
        }
    }

    static double number(Map<String, Object> row, String key) {
        Object value = row.get(key);
        return value instanceof Number n ? n.doubleValue() : Double.parseDouble(String.valueOf(value));
    }
    static long longNumber(Map<String, Object> row, String key) {
        Object value = row.get(key);
        return value instanceof Number n ? n.longValue() : Long.parseLong(String.valueOf(value));
    }
    static Instant instant(Object value) {
        if (value instanceof Instant instant) return instant;
        if (value instanceof Number n) {
            long epoch = n.longValue();
            if (Math.abs(epoch) > 10_000_000_000_000L) return Instant.ofEpochSecond(0, epoch);
            if (Math.abs(epoch) > 10_000_000_000L) return Instant.ofEpochMilli(epoch);
            return Instant.ofEpochSecond(epoch);
        }
        String text = String.valueOf(value);
        try {
            return Instant.parse(text);
        } catch (java.time.format.DateTimeParseException ignored) {
            try {
                return OffsetDateTime.parse(text).toInstant();
            } catch (java.time.format.DateTimeParseException alsoIgnored) {
                // InfluxDB 3 JSON currently emits UTC timestamps without a trailing zone.
                return LocalDateTime.parse(text).toInstant(ZoneOffset.UTC);
            }
        }
    }
    static String escapeTag(String value) {
        return value.replace("\\", "\\\\").replace(" ", "\\ ")
                .replace(",", "\\,").replace("=", "\\=");
    }
    private record QueryRequest(String db, String q, Map<String, Object> params, String format) { }
}
