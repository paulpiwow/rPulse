package com.rpulse.backend.influx;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

@Service
public class TelemetryService {

    static final int DEFAULT_LIMIT = 100;
    static final int MAX_LIMIT = 500;

    private final InfluxQueryClient influxQueryClient;
    private final InfluxProperties properties;

    TelemetryService(InfluxQueryClient influxQueryClient, InfluxProperties properties) {
        this.influxQueryClient = influxQueryClient;
        this.properties = properties;
    }

    public boolean isHealthy() {
        return influxQueryClient.isHealthy();
    }

    public String database() {
        return properties.database();
    }

    public List<Map<String, Object>> latestReadings(
            String siteName,
            String lineName,
            String assetName,
            String tagName,
            int limit) {
        if (limit < 1 || limit > MAX_LIMIT) {
            throw new IllegalArgumentException("limit must be between 1 and " + MAX_LIMIT);
        }

        List<String> predicates = new ArrayList<>();
        Map<String, Object> parameters = new LinkedHashMap<>();
        addFilter(predicates, parameters, "siteName", siteName);
        addFilter(predicates, parameters, "lineName", lineName);
        addFilter(predicates, parameters, "assetName", assetName);
        addFilter(predicates, parameters, "tagName", tagName);

        StringBuilder sql = new StringBuilder("SELECT * FROM raw_measurement");
        if (!predicates.isEmpty()) {
            sql.append(" WHERE ").append(String.join(" AND ", predicates));
        }
        sql.append(" ORDER BY time DESC LIMIT ").append(limit);

        return influxQueryClient.query(sql.toString(), parameters);
    }

    private static void addFilter(
            List<String> predicates,
            Map<String, Object> parameters,
            String field,
            String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        predicates.add("\"" + field + "\" = $" + field);
        parameters.put(field, value.trim());
    }
}
