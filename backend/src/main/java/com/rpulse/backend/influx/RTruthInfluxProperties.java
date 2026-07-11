package com.rpulse.backend.influx;

import java.net.URI;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Connection and schema details for the upstream rTruth InfluxDB. */
@ConfigurationProperties(prefix = "rpulse.rtruth")
public record RTruthInfluxProperties(URI url, String database, String rawMeasurement,
        String ctagMeasurement, String token, String org, Duration connectTimeout,
        Duration readTimeout) {
}
