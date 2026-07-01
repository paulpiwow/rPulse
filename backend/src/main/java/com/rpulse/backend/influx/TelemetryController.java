package com.rpulse.backend.influx;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/telemetry")
public class TelemetryController {

    private final TelemetryService telemetryService;

    TelemetryController(TelemetryService telemetryService) {
        this.telemetryService = telemetryService;
    }

    @GetMapping("/health")
    public ResponseEntity<InfluxHealthResponse> health() {
        boolean healthy = telemetryService.isHealthy();
        HttpStatus status = healthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
        return ResponseEntity.status(status)
                .body(new InfluxHealthResponse(
                        healthy ? "up" : "down",
                        telemetryService.database()));
    }

    @GetMapping("/readings/latest")
    public TelemetryResponse latestReadings(
            @RequestParam(required = false) String siteName,
            @RequestParam(required = false) String lineName,
            @RequestParam(required = false) String assetName,
            @RequestParam(required = false) String tagName,
            @RequestParam(defaultValue = "100") int limit) {
        List<Map<String, Object>> readings = telemetryService.latestReadings(
                siteName,
                lineName,
                assetName,
                tagName,
                limit);
        return new TelemetryResponse(telemetryService.database(), readings.size(), readings);
    }

    public record InfluxHealthResponse(String status, String database) {
    }

    public record TelemetryResponse(
            String database,
            int count,
            List<Map<String, Object>> readings) {
    }
}
