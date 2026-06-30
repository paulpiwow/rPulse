package com.rpulse.backend.alarmadmin.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rpulse.backend.alarmadmin.entity.SystemMessage;

/**
 * The "filing cabinet" for SystemMessage records — how the app saves, finds, and deletes
 * Message Center messages.
 *
 * <p>Extending {@code JpaRepository<SystemMessage, Long>} provides the standard operations
 * (save, find by id, list all, delete). The two look-ups below have their queries built
 * automatically from their method names. See {@link AlarmHistoryRepository} for the fuller
 * explanation of how that works.
 */
public interface SystemMessageRepository extends JpaRepository<SystemMessage, Long> {

    /** Find the one message with this unique business code. {@code Optional} = "maybe found, maybe not". */
    Optional<SystemMessage> findByCode(String code);

    /** List all messages in a particular status (e.g. every "Unread" message). */
    List<SystemMessage> findByStatus(String status);
}
