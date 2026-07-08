package com.rpulse.backend.influx;

/** Statistics attached to every point written by the Stage-1 ingestion pipeline. */
public record RollingStatistics(double low, double high, double mean, double stdDev, long count) {
}
