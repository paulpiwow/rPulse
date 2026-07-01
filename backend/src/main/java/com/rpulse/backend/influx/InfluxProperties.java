package com.rpulse.backend.influx;

import java.net.URI;
import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "rpulse.influx")
public record InfluxProperties(
        URI url,
        String database,
        String token,
        Duration connectTimeout,
        Duration readTimeout) {
}
