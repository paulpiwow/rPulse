package com.rpulse.backend.alarmadmin.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rpulse.backend.alarmadmin.entity.AppLicense;

/**
 * The "filing cabinet" for AppLicense records — how the app saves, finds, and deletes
 * customer licenses.
 *
 * <p>Extending {@code JpaRepository<AppLicense, Long>} gives us the standard operations
 * (save, find by id, list all, delete) without writing any database code. The methods
 * below are custom look-ups whose queries the framework builds from their names. See
 * {@link AlarmHistoryRepository} for the fuller explanation.
 */
public interface AppLicenseRepository extends JpaRepository<AppLicense, Long> {

    /** Find the one license with this unique business code. {@code Optional} = "maybe found, maybe not". */
    Optional<AppLicense> findByCode(String code);

    /** List every license tied to a particular site. */
    List<AppLicense> findBySiteId(Long siteId);
}
