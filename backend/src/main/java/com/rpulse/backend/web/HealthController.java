package com.rpulse.backend.web;

import java.time.Instant;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/")
    public Map<String, Object> root() {
        return Map.of(
                "service", "rpulse-backend",
                "status", "ok",
                "timestamp", Instant.now().toString());
    }
}
