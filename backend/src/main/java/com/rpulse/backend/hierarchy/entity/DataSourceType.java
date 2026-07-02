package com.rpulse.backend.hierarchy.entity;

/**
 * The kind of connector a {@link Datasource} speaks to, which decides how the app discovers
 * the tags it publishes (the Connect Tags screen's left panel):
 *
 * <ul>
 *   <li>{@code HISTORIAN} — data already flows into a historian (rTruth). Available tags are
 *       discovered by querying that historian.</li>
 *   <li>{@code PLC} — data is read directly from a controller. Tag discovery for these is not
 *       available in Phase 6 (there is no live catalog to query yet).</li>
 * </ul>
 *
 * <p>This is distinct from the free-text {@code sourceType} label ("PLC | Historian | VFD |
 * Sensor") kept for display; {@code type} is the machine-readable routing key.
 */
public enum DataSourceType {
    HISTORIAN,
    PLC
}
