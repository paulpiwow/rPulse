package com.rpulse.backend.operate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rpulse.backend.hierarchy.entity.Baseline;
import com.rpulse.backend.hierarchy.repository.BaselineRepository;
import com.rpulse.backend.influx.RTruthConnector;
import com.rpulse.backend.influx.TagReading;

/**
 * Computes maintenance warnings: reads the enabled Tag/CTag baselines, pulls the current
 * value for each series from rTruth, and reports the ones now reading outside their baseline
 * range. Read-only against both Postgres and Influx — it never writes history or messages
 * (that only happens on an explicit operator Notify).
 */
@Service
public class MaintenanceService {

    private final BaselineRepository baselines;
    private final RTruthConnector connector;

    public MaintenanceService(BaselineRepository baselines, RTruthConnector connector) {
        this.baselines = baselines;
        this.connector = connector;
    }

    @Transactional(readOnly = true)
    public List<MaintenanceWarning> evaluate() {
        // Enabled baselines that target a concrete series (Tag or CTag scope).
        List<Baseline> targeted = baselines.findAll().stream()
                .filter(Baseline::isEnabled)
                .filter(b -> seriesKey(b) != null)
                .toList();

        Set<String> keys = new HashSet<>();
        for (Baseline b : targeted) {
            keys.add(seriesKey(b));
        }
        Map<String, TagReading> readings = keys.isEmpty() ? Map.of() : connector.getLatest(keys);

        List<MaintenanceWarning> warnings = new ArrayList<>();
        for (Baseline b : targeted) {
            TagReading reading = readings.get(seriesKey(b));
            if (reading == null) {
                continue;
            }
            String direction = direction(b, reading.value());
            if (direction == null) {
                continue;   // within range — not a warning
            }
            warnings.add(new MaintenanceWarning(
                    seriesKey(b),
                    b.getScope(),
                    b.getAsset().getCode(),
                    reading.value(),
                    b.getBaselineLow(),
                    b.getBaselineHigh(),
                    b.getBaselineTarget(),
                    b.getBaselineStdDev(),
                    direction));
        }
        return warnings;
    }

    /** BELOW if under the low bound, ABOVE if over the high bound, otherwise null (in range). */
    private static String direction(Baseline b, double value) {
        BigDecimal low = b.getBaselineLow();
        BigDecimal high = b.getBaselineHigh();
        if (low != null && value < low.doubleValue()) {
            return "BELOW";
        }
        if (high != null && value > high.doubleValue()) {
            return "ABOVE";
        }
        return null;
    }

    /** The Influx series key for a baseline's target, or null for Asset-scope baselines. */
    private static String seriesKey(Baseline b) {
        if ("Tag".equalsIgnoreCase(b.getScope()) && b.getTag() != null) {
            return b.getTag().getCode();
        }
        if ("CTag".equalsIgnoreCase(b.getScope()) && b.getCtag() != null) {
            return b.getCtag().getCode();
        }
        return null;
    }
}
