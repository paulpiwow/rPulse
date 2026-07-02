package com.rpulse.backend.influx;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;

/**
 * rPulse's OWN local time-series store — the second stage of the scheduler pipeline reads
 * current values from here, not from rTruth. Stage 1 (owned by Marshall) pulls raw readings
 * from the historian / connectors and writes them into this local Influx; Stage 2 (the alarm
 * engine) evaluates rules against what Stage 1 last wrote.
 *
 * <p>Keeping the engine on this interface (rather than on {@link RTruthConnector}) is deliberate:
 * the engine must never reach out to rTruth on the evaluation hot path. Baseline reestablishment,
 * trend charts and Site Status still go through {@link RTruthConnector}; only live alarm
 * evaluation reads from here.
 *
 * <p>There are two implementations: a {@code MockLocalInfluxStore} (active by default) that
 * synthesises deterministic moving values so alarms trip and clear end-to-end before Stage 1
 * and a real local Influx exist, and — later — a live implementation on the {@code live} profile.
 */
public interface LocalInfluxStore {

    /** Latest locally-stored value for a single series key, or empty if nothing has been written. */
    Optional<TagReading> getLatest(String tagKey);

    /**
     * Latest locally-stored values for many series keys in one lookup (the deduped fetch the
     * engine relies on — evaluating N rules costs one call). Keys with no data are simply absent
     * from the returned map.
     */
    Map<String, TagReading> getLatest(Collection<String> tagKeys);
}
