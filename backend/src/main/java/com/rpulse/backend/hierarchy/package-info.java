/**
 * Hierarchy domain (OWNER: Ty) — JPA entities + repositories for the asset
 * hierarchy defined in {@code V2__hierarchy.sql}: site, asset, machine,
 * data_source, tag, ctag, baseline_rule.
 *
 * <p>How to plug an entity in here:
 * <ol>
 *   <li>Create the class in an {@code .entity} subpackage and extend
 *       {@link com.rpulse.backend.common.BaseEntity} — that supplies the shared
 *       {@code id}, {@code code}, {@code created_at} and {@code updated_at}
 *       mappings, so you only declare the table's domain columns.</li>
 *   <li>Add a Spring Data repository (interface extending
 *       {@code JpaRepository<T, Long>}) in a {@code .repository} subpackage. It is
 *       auto-detected — anything under {@code com.rpulse.backend} is scanned, so no
 *       extra configuration is needed.</li>
 *   <li>Map foreign keys with {@code @ManyToOne} (e.g. asset → site).</li>
 * </ol>
 *
 * <p>Notes:
 * <ul>
 *   <li>{@code spring.jpa.hibernate.ddl-auto=validate} — every entity is checked
 *       against the live Flyway-built schema at startup, so a wrong column/table
 *       name fails the app fast instead of silently.</li>
 *   <li>Model only the <em>configuration</em> columns the migration defines. Live
 *       runtime values (latest tag values, counts, status) come from rTruth/Influx
 *       at read time and are intentionally not persisted.</li>
 * </ul>
 */
package com.rpulse.backend.hierarchy;
