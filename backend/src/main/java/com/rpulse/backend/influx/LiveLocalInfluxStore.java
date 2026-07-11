package com.rpulse.backend.influx;

import java.time.Instant;
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

/** Live Stage-1 store backed by rPulse's private InfluxDB 3 database. */
@Component
@Profile("live")
public class LiveLocalInfluxStore implements LocalInfluxStore {
    private final RestClient client;
    private final LocalInfluxProperties properties;

    public LiveLocalInfluxStore(@Qualifier("localInfluxRestClient") RestClient client,
                                LocalInfluxProperties properties) {
        this.client = client;
        this.properties = properties;
    }

    @Override
    public void writePoint(TagReading reading, RollingStatistics stats) {
        writeRawPoint(reading, stats);
    }

    @Override
    public void writeRawPoint(TagReading reading, RollingStatistics stats) {
        writeToMeasurement(properties.rawMeasurement(), reading);
    }

    @Override
    public void writeComputedPoint(TagReading reading, RollingStatistics stats) {
        writeToMeasurement(properties.ctagMeasurement(), reading);
    }

    @Override
    public Optional<TagReading> getLatest(String tagKey) {
        return Optional.ofNullable(getLatest(List.of(tagKey)).get(tagKey));
    }

    @Override
    public Map<String, TagReading> getLatest(Collection<String> tagKeys) {
        Map<String, TagReading> result = new LinkedHashMap<>(getLatestFromMeasurement(tagKeys,
                properties.rawMeasurement()));
        result.putAll(getLatestFromMeasurement(tagKeys, properties.ctagMeasurement()));
        return result;
    }

    private Map<String, TagReading> getLatestFromMeasurement(Collection<String> tagKeys, String measurementName) {
        List<String> keys = tagKeys.stream().filter(k -> k != null && !k.isBlank()).distinct().toList();
        if (keys.isEmpty()) return Map.of();
        Map<String, Object> params = new LinkedHashMap<>();
        String placeholders = IntStream.range(0, keys.size()).mapToObj(i -> {
            params.put("k" + i, keys.get(i));
            return "$k" + i;
        }).reduce((a, b) -> a + "," + b).orElseThrow();
        String sql = "SELECT \"tagKey\", value, time FROM (SELECT \"tagName\" AS \"tagKey\", value, time, "
                + "row_number() OVER (PARTITION BY \"tagName\" ORDER BY time DESC) AS rn FROM "
                + identifier(measurementName) + " WHERE \"tagName\" IN (" + placeholders
                + ")) WHERE rn = 1";
        Map<String, TagReading> result = new LinkedHashMap<>();
        for (Map<String, Object> row : InfluxHttpSupport.query(client, properties.database(), sql, params)) {
            String key = String.valueOf(row.get("tagKey"));
            result.put(key, new TagReading(key, InfluxHttpSupport.number(row, "value"),
                    InfluxHttpSupport.instant(row.get("time"))));
        }
        return result;
    }

    private void writeToMeasurement(String measurementName, TagReading reading) {
        String line = identifier(measurementName) + ",tagName="
                + InfluxHttpSupport.escapeTag(reading.tagKey()) + " value=" + reading.value()
                + " " + epochNanos(reading.time());
        InfluxHttpSupport.write(client, properties.database(), properties.org(), line);
    }

    private static String identifier(String value) {
        if (value == null || !value.matches("[A-Za-z_][A-Za-z0-9_]*"))
            throw new IllegalArgumentException("Invalid Influx measurement: " + value);
        return value;
    }
    private static long epochNanos(Instant time) {
        return Math.addExact(Math.multiplyExact(time.getEpochSecond(), 1_000_000_000L), time.getNano());
    }
}
