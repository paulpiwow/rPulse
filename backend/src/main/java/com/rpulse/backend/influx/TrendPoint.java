package com.rpulse.backend.influx;

import java.time.Instant;

/**
 * One point on a trend series for a tag/ctag — a value at a timestamp. A list of these
 * drives the trend charts.
 */
public record TrendPoint(Instant time, double value) {
}
