package com.rpulse.backend.influx;

import java.time.Instant;

/**
 * The latest known value of one tag (or ctag) from rTruth, at a point in time.
 *
 * @param tagKey the Influx series key — the tag/ctag {@code code} (e.g. "suct-press")
 * @param value  the numeric reading
 * @param time   when the reading was taken
 */
public record TagReading(String tagKey, double value, Instant time) {
}
