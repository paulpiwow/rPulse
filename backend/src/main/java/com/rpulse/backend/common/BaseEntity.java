package com.rpulse.backend.common;

import java.time.OffsetDateTime;

import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;

/**
 * Shared base for every id-bearing rPulse entity, encoding the conventions from
 * the Flyway migrations (see V1__foundation.sql):
 *
 * <ul>
 *   <li>{@code id BIGINT GENERATED ALWAYS AS IDENTITY} surrogate primary key.</li>
 *   <li>{@code code VARCHAR(64) NOT NULL UNIQUE} natural business key (e.g. "GRP-001",
 *       "suct-press") — set this yourself; it's what the UI / Influx series key on.</li>
 *   <li>{@code created_at} / {@code updated_at} audit columns. These are maintained
 *       by the database (DEFAULT now() + the set_updated_at() trigger), so they are
 *       mapped read-only and re-read after writes — never set them from Java.</li>
 * </ul>
 *
 * Extend this for any table that has an {@code id} + {@code code}. Pure join tables
 * (user_group, alarm_notify_group, alarm_notify_user) have composite keys and no
 * audit columns, so they do NOT extend this — map those with @IdClass/@EmbeddedId.
 */
@MappedSuperclass
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @Column(name = "code", nullable = false, unique = true, length = 64)
    private String code;

    @Generated(event = EventType.INSERT)
    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Generated(event = { EventType.INSERT, EventType.UPDATE })
    @Column(name = "updated_at", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}
