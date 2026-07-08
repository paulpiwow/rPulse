package com.rpulse.backend.influx;

import java.net.URI;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Connection and schema details for rPulse's private InfluxDB. */
@ConfigurationProperties(prefix = "rpulse.local-influx")
public record LocalInfluxProperties(URI url, String database, String measurement,
        String token, String org, Duration connectTimeout, Duration readTimeout) {
}
