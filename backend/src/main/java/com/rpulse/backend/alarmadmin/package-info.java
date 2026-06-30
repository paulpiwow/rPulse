/**
 * Alarm + Admin domain (OWNER: Ben) — JPA entities + repositories for the tables
 * defined in {@code V3__alarm_admin.sql}: app_user, notification_group,
 * user_group, alarm_rule, alarm_notify_group, alarm_notify_user, alarm_history,
 * system_message, app_license. (Split into {@code alarm} / {@code admin}
 * subpackages if you prefer.)
 *
 * <p>How to plug an entity in here:
 * <ol>
 *   <li>Create the class in an {@code .entity} subpackage and extend
 *       {@link com.rpulse.backend.common.BaseEntity} for the standard
 *       {@code id} + {@code code} + audit columns; declare only the domain columns.</li>
 *   <li>Add a Spring Data repository ({@code JpaRepository<T, Long>}) in a
 *       {@code .repository} subpackage — auto-detected, no config needed.</li>
 * </ol>
 *
 * <p>Special cases in this domain:
 * <ul>
 *   <li><strong>Join tables</strong> ({@code user_group}, {@code alarm_notify_group},
 *       {@code alarm_notify_user}) have composite primary keys and no {@code id} /
 *       audit columns, so they do <em>not</em> extend {@code BaseEntity}. Map them
 *       with {@code @IdClass}/{@code @EmbeddedId}, or model the relationships as
 *       {@code @ManyToMany} on the owning entities.</li>
 *   <li>{@code alarm_history} is written by the alarm-evaluation engine; it has no
 *       interactive CRUD owner.</li>
 *   <li>{@code spring.jpa.hibernate.ddl-auto=validate} checks each entity against
 *       the live Flyway-built schema at startup.</li>
 * </ul>
 */
package com.rpulse.backend.alarmadmin;
