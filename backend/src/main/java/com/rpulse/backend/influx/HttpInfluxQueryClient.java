package com.rpulse.backend.influx;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
class HttpInfluxQueryClient implements InfluxQueryClient {

    private static final ParameterizedTypeReference<List<Map<String, Object>>> ROW_LIST =
            new ParameterizedTypeReference<>() {
            };

    private final RestClient restClient;
    private final InfluxProperties properties;

    HttpInfluxQueryClient(
            @Qualifier("influxRestClient") RestClient restClient,
            InfluxProperties properties) {
        this.restClient = restClient;
        this.properties = properties;
    }

    @Override
    public boolean isHealthy() {
        try {
            String response = restClient.get()
                    .uri("/health")
                    .retrieve()
                    .body(String.class);
            return response != null && response.trim().equalsIgnoreCase("OK");
        } catch (RestClientException exception) {
            return false;
        }
    }

    @Override
    public List<Map<String, Object>> query(String sql, Map<String, Object> parameters) {
        QueryRequest request = new QueryRequest(properties.database(), sql, parameters, "json");
        try {
            List<Map<String, Object>> rows = restClient.post()
                    .uri("/api/v3/query_sql")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(ROW_LIST);
            return rows == null ? List.of() : rows;
        } catch (RestClientException exception) {
            throw new InfluxUnavailableException("Unable to query rTruth InfluxDB", exception);
        }
    }

    private record QueryRequest(
            String db,
            String q,
            Map<String, Object> params,
            String format) {
    }
}
