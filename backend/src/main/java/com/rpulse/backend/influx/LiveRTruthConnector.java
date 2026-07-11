package com.rpulse.backend.influx;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.IntStream;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/** Live rTruth adapter using InfluxDB 3's SQL and v2 line-protocol endpoints. */
@Component
@Profile("live")
public class LiveRTruthConnector implements RTruthConnector {
    private final RestClient client;
    private final RTruthInfluxProperties properties;

    public LiveRTruthConnector(@Qualifier("rtruthRestClient") RestClient client,
                               RTruthInfluxProperties properties) {
        this.client = client;
        this.properties = properties;
    }

    @Override
    public Optional<TagReading> getLatest(String tagKey) {
        return Optional.ofNullable(getLatest(List.of(tagKey)).get(tagKey));
    }

    @Override
    public Optional<TagReading> getLatestRaw(String tagKey) {
        return Optional.ofNullable(getLatestRaw(List.of(tagKey)).get(tagKey));
    }

    @Override
    public Optional<TagReading> getLatestComputed(String tagKey) {
        return Optional.ofNullable(getLatestComputed(List.of(tagKey)).get(tagKey));
    }

    @Override
    public Map<String, TagReading> getLatest(Collection<String> tagKeys) {
        Map<String, TagReading> result = new LinkedHashMap<>(getLatestRaw(tagKeys));
        result.putAll(getLatestComputed(tagKeys));
        return result;
    }

    @Override
    public Map<String, TagReading> getLatestRaw(Collection<String> tagKeys) {
        return getLatestFromMeasurement(tagKeys, properties.rawMeasurement());
    }

    @Override
    public Map<String, TagReading> getLatestComputed(Collection<String> tagKeys) {
        return getLatestFromMeasurement(tagKeys, properties.ctagMeasurement());
    }

    private Map<String, TagReading> getLatestFromMeasurement(Collection<String> tagKeys, String measurementName) {
        List<String> keys = tagKeys.stream().filter(k -> k != null && !k.isBlank()).distinct().toList();
        if (keys.isEmpty()) return Map.of();
        Map<String, Object> params = new LinkedHashMap<>();
        String placeholders = IntStream.range(0, keys.size()).mapToObj(i -> {
            params.put("k" + i, keys.get(i));
            return "$k" + i;
        }).reduce((a, b) -> a + "," + b).orElseThrow();
        String measurement = identifier(measurementName);
        String sql = "SELECT \"tagKey\", value, time FROM (SELECT \"tagName\" AS \"tagKey\", value, time, "
                + "row_number() OVER (PARTITION BY \"tagName\" ORDER BY time DESC) AS rn FROM "
                + measurement + " WHERE \"tagName\" IN (" + placeholders + ")) WHERE rn = 1";
        Map<String, TagReading> result = new LinkedHashMap<>();
        for (Map<String, Object> row : InfluxHttpSupport.query(client, properties.database(), sql, params)) {
            String key = String.valueOf(row.get("tagKey"));
            result.put(key, new TagReading(key, InfluxHttpSupport.number(row, "value"),
                    InfluxHttpSupport.instant(row.get("time"))));
        }
        return result;
    }

    @Override
    public List<AvailableTag> listAvailableTags() {
        String sql = "SELECT DISTINCT \"tagName\" AS \"tagKey\" FROM " + identifier(properties.rawMeasurement())
                + " ORDER BY \"tagKey\"";
        return InfluxHttpSupport.query(client, properties.database(), sql, Map.of()).stream()
                .map(row -> new AvailableTag(String.valueOf(row.get("tagKey")),
                        String.valueOf(row.get("tagKey")), null)).toList();
    }

    @Override
    public List<TrendPoint> getTrend(String tagKey, Duration window) {
        List<TrendPoint> raw = getTrendFromMeasurement(tagKey, window, properties.rawMeasurement());
        return raw.isEmpty() ? getTrendFromMeasurement(tagKey, window, properties.ctagMeasurement()) : raw;
    }

    private List<TrendPoint> getTrendFromMeasurement(String tagKey, Duration window, String measurementName) {
        long seconds = Math.max(1, window.getSeconds());
        String sql = "SELECT time, value FROM " + identifier(measurementName)
                + " WHERE \"tagName\" = $tagKey AND time >= now() - interval '" + seconds
                + " seconds' ORDER BY time";
        List<TrendPoint> result = new ArrayList<>();
        for (Map<String, Object> row : InfluxHttpSupport.query(client, properties.database(), sql,
                Map.of("tagKey", tagKey))) {
            result.add(new TrendPoint(InfluxHttpSupport.instant(row.get("time")),
                    InfluxHttpSupport.number(row, "value")));
        }
        return result;
    }

    @Override
    public Aggregates getAggregates(String tagKey, Instant start, Instant end) {
        Aggregates raw = getAggregatesFromMeasurement(tagKey, start, end, properties.rawMeasurement());
        return raw.count() == 0 ? getAggregatesFromMeasurement(tagKey, start, end, properties.ctagMeasurement()) : raw;
    }

    private Aggregates getAggregatesFromMeasurement(String tagKey, Instant start, Instant end,
                                                    String measurementName) {
        String sql = "SELECT min(value) AS min, max(value) AS max, avg(value) AS avg, "
                + "stddev(value) AS \"stdDev\", count(value) AS count FROM "
                + identifier(measurementName)
                + " WHERE \"tagName\" = $tagKey AND time >= $start AND time <= $end";
        List<Map<String, Object>> rows = InfluxHttpSupport.query(client, properties.database(), sql,
                Map.of("tagKey", tagKey, "start", start.toString(), "end", end.toString()));
        if (rows.isEmpty() || rows.get(0).get("count") == null) return new Aggregates(0, 0, 0, 0, 0);
        Map<String, Object> row = rows.get(0);
        long count = InfluxHttpSupport.longNumber(row, "count");
        if (count == 0) return new Aggregates(0, 0, 0, 0, 0);
        double stdDev = count < 2 || row.get("stdDev") == null ? 0
                : InfluxHttpSupport.number(row, "stdDev");
        return new Aggregates(InfluxHttpSupport.number(row, "min"), InfluxHttpSupport.number(row, "max"),
                InfluxHttpSupport.number(row, "avg"), stdDev, count);
    }

    @Override
    public void writePoint(String tagKey, double value, Instant time) {
        writeComputedPoint(tagKey, value, time);
    }

    @Override
    public void writeComputedPoint(String tagKey, double value, Instant time) {
        String line = identifier(properties.ctagMeasurement()) + ",tagName=" + InfluxHttpSupport.escapeTag(tagKey)
                + " value=" + value + " " + epochNanos(time);
        InfluxHttpSupport.write(client, properties.database(), properties.org(), line);
    }

    private static String identifier(String value) {
        if (value == null || !value.matches("[A-Za-z_][A-Za-z0-9_]*")) {
            throw new IllegalArgumentException("Invalid Influx measurement: " + value);
        }
        return value;
    }
    private static long epochNanos(Instant time) {
        return Math.addExact(Math.multiplyExact(time.getEpochSecond(), 1_000_000_000L), time.getNano());
    }
}
