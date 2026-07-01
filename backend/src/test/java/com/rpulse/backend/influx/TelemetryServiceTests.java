package com.rpulse.backend.influx;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.net.URI;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TelemetryServiceTests {

    @Mock
    private InfluxQueryClient client;

    private TelemetryService service;

    @BeforeEach
    void setUp() {
        InfluxProperties properties = new InfluxProperties(
                URI.create("http://localhost:8087"),
                "raw_bucket",
                "",
                Duration.ofSeconds(3),
                Duration.ofSeconds(10));
        service = new TelemetryService(client, properties);
    }

    @Test
    void buildsParameterizedLatestReadingsQuery() {
        List<Map<String, Object>> expected = List.of(Map.of("tagName", "x_01", "value", 42.5));
        String sql = "SELECT * FROM raw_measurement WHERE \"siteName\" = $siteName"
                + " AND \"tagName\" = $tagName ORDER BY time DESC LIMIT 25";
        Map<String, Object> parameters = Map.of("siteName", "Site 1", "tagName", "x_01");
        when(client.query(sql, parameters)).thenReturn(expected);

        List<Map<String, Object>> actual = service.latestReadings(" Site 1 ", null, null, "x_01", 25);

        assertThat(actual).isEqualTo(expected);
        verify(client).query(sql, parameters);
    }

    @Test
    void rejectsLimitsOutsideTheSupportedRange() {
        assertThatThrownBy(() -> service.latestReadings(null, null, null, null, 0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("limit must be between 1 and 500");
        assertThatThrownBy(() -> service.latestReadings(null, null, null, null, 501))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("limit must be between 1 and 500");
    }

    @Test
    void reportsConfiguredDatabaseAndClientHealth() {
        when(client.isHealthy()).thenReturn(true);

        assertThat(service.database()).isEqualTo("raw_bucket");
        assertThat(service.isHealthy()).isTrue();
    }
}
