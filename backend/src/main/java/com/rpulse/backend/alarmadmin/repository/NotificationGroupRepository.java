package com.rpulse.backend.alarmadmin.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rpulse.backend.alarmadmin.entity.NotificationGroup;

/**
 * The "filing cabinet" for NotificationGroup records — how the app saves, finds, and
 * deletes notification groups.
 *
 * <p>Extending {@code JpaRepository<NotificationGroup, Long>} provides the standard
 * operations (save, find by id, list all, delete) without any database code of our own.
 * See {@link AlarmHistoryRepository} for the fuller explanation of how repositories work.
 */
public interface NotificationGroupRepository extends JpaRepository<NotificationGroup, Long> {

    /** Find the one group with this unique business code. {@code Optional} = "maybe found, maybe not". */
    Optional<NotificationGroup> findByCode(String code);
}
