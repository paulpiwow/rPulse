package com.rpulse.backend.influx;

import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.Map;
import java.util.List;
import java.util.Optional;

/**
 * The single funnel for all rTruth Influx access, per the Phase 6 design (Page 5). Every
 * part of the app that needs live time-series data — the alarm engine, Site Status,
 * Maintenance Warnings, the trend charts, and baseline reestablishment — goes through
 * this interface and nothing else. That keeps the query patterns and bucket/measurement
 * naming in one place.
 *
 * <p>There are two implementations: a {@code MockRTruthConnector} (active by default) that
 * synthesises deterministic values so the whole system runs end-to-end before the Phase 5
 * Skid Simulator exists, and — later — a live HTTP implementation that talks to the real
 * rTruth Influx. Swapping from mock to live is a matter of activating the {@code live}
 * Spring profile; no engine or endpoint code changes, because they only ever see this
 * interface.
 */
public interface RTruthConnector {

    /** Latest value for a single tag/ctag series key, or empty if the series has no data. */
    Optional<TagReading> getLatest(String tagKey);

    /**
     * Latest value for many series keys in a single round-trip (the deduped fetch the
     * engine relies on — evaluating N rules costs one call). Keys with no data are simply
     * absent from the returned map.
     */
    Map<String, TagReading> getLatest(Collection<String> tagKeys);

    /** Trend series for one tag/ctag over a trailing window (Connector pattern 3). */
    List<TrendPoint> getTrend(String tagKey, Duration window);

    /** MIN/MAX/AVG/STDDEV/COUNT for one tag over a window (Connector pattern 4). */
    Aggregates getAggregates(String tagKey, Instant start, Instant end);

    /** Write a single computed point back to Influx (used to persist ctag values). */
    void writePoint(String tagKey, double value, Instant time);
}
