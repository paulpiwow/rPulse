package com.rpulse.backend.influx;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** Maintains a bounded, in-memory trailing window for every Stage-1 series. */
@Service
public class RollingStatisticsCalculator {
    private final Duration window;
    private final Map<String, Deque<TagReading>> windows = new ConcurrentHashMap<>();

    public RollingStatisticsCalculator(@Value("${rpulse.stage1.rolling-window:PT15M}") Duration window) {
        if (window.isNegative() || window.isZero()) throw new IllegalArgumentException("rolling window must be positive");
        this.window = window;
    }

    public RollingStatistics add(TagReading reading) {
        Deque<TagReading> values = windows.computeIfAbsent(reading.tagKey(), ignored -> new ArrayDeque<>());
        synchronized (values) {
            Instant cutoff = reading.time().minus(window);
            while (!values.isEmpty() && values.peekFirst().time().isBefore(cutoff)) values.removeFirst();
            values.addLast(reading);
            double low = Double.POSITIVE_INFINITY;
            double high = Double.NEGATIVE_INFINITY;
            double sum = 0;
            for (TagReading value : values) {
                low = Math.min(low, value.value());
                high = Math.max(high, value.value());
                sum += value.value();
            }
            double mean = sum / values.size();
            double squared = 0;
            for (TagReading value : values) {
                double delta = value.value() - mean;
                squared += delta * delta;
            }
            double stdDev = values.size() < 2 ? 0 : Math.sqrt(squared / (values.size() - 1));
            return new RollingStatistics(low, high, mean, stdDev, values.size());
        }
    }
}
