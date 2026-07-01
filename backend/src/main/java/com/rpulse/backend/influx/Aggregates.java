package com.rpulse.backend.influx;

/**
 * Summary statistics for one tag over a time window — the result of Connector pattern 4
 * (MIN/MAX/AVG/STDDEV/COUNT). Used when reestablishing baselines from a "known normal"
 * window.
 */
public record Aggregates(double min, double max, double avg, double stdDev, long count) {
}
