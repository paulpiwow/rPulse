package com.rpulse.backend.maintenance.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rpulse.backend.maintenance.entity.MaintenanceWarningHistory;

/**
 * Spring Data repository for {@link MaintenanceWarningHistory} (the
 * {@code maintenance_warning_history} table). Auto-detected by component scan
 * (everything under {@code com.rpulse.backend} is scanned), so no extra
 * configuration is needed.
 *
 * <p>The method names read like sentences on purpose — Spring Data turns each one
 * into the matching database query automatically, so there is no SQL to maintain
 * here.
 */
public interface MaintenanceWarningHistoryRepository extends JpaRepository<MaintenanceWarningHistory, Long> {

    /** Find one warning by its unique business code (e.g. "MWH-..."). */
    Optional<MaintenanceWarningHistory> findByCode(String code);

    /**
     * The most recent still-open warning for a given baseline, if any. The engine
     * uses this to re-adopt an open warning after a restart, so it doesn't write a
     * duplicate for a drift that is already being tracked.
     */
    Optional<MaintenanceWarningHistory> findFirstByBaseline_IdAndStatusInOrderByTripTimeDesc(
            Long baselineId, Collection<String> statuses);

    /** Every warning currently in a given state (e.g. all ACTIVE ones). */
    List<MaintenanceWarningHistory> findByStatus(String status);
}
