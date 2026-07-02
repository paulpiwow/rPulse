package com.rpulse.backend.influx;

/**
 * One tag a data source's connector reports as available to connect — the raw entries shown
 * on the left side of the Connect Tags screen, before the user binds any of them into the
 * hierarchy. This is discovery metadata (what the source publishes), not a stored tag.
 *
 * @param tagKey the native series key as it lands in Influx (what a bound {@code Tag.tagKey} holds)
 * @param name   a human-readable label for the tag, if the source provides one
 * @param unit   the engineering unit, if known
 */
public record AvailableTag(String tagKey, String name, String unit) {
}
