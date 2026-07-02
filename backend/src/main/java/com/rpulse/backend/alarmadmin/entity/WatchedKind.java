package com.rpulse.backend.alarmadmin.entity;

/**
 * Which kind of series an {@link AlarmRule} watches. An alarm points at a single target by id
 * ({@code watchedTagId}); this says whether that id is a measured {@code Tag} or a computed
 * {@code CTag}, so the engine knows which table to resolve it against.
 */
public enum WatchedKind {
    TAG,
    CTAG
}
