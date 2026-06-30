package com.rpulse.backend.alarmadmin.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rpulse.backend.alarmadmin.entity.AppUser;

/**
 * The "filing cabinet" for AppUser records — how the app saves, finds, and deletes users.
 *
 * <p>Extending {@code JpaRepository<AppUser, Long>} gives us the standard operations
 * (save, find by id, list all, delete) for free. The two look-ups below have their queries
 * built automatically from their method names. See {@link AlarmHistoryRepository} for the
 * fuller explanation of how that works.
 */
public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    /** Find the one user with this unique business code. {@code Optional} = "maybe found, maybe not". */
    Optional<AppUser> findByCode(String code);

    /** Find the one user with this email address (emails are unique, so at most one matches). */
    Optional<AppUser> findByEmail(String email);
}
