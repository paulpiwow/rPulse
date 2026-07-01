package com.rpulse.backend.influx;

import java.util.List;
import java.util.Map;

public interface InfluxQueryClient {

    boolean isHealthy();

    List<Map<String, Object>> query(String sql, Map<String, Object> parameters);
}
