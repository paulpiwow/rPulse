package com.rpulse.backend.alarmadmin.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rpulse.backend.alarmadmin.entity.AlarmHistory;

/**
 * The "filing cabinet" for AlarmHistory records.
 *
 * <p>Plain-English picture: an entity like {@link AlarmHistory} describes what one record
 * looks like; a repository is how the app saves, finds, and deletes those records in the
 * database. We don't have to write the database code ourselves — by extending
 * {@code JpaRepository<AlarmHistory, Long>}, the framework automatically provides the
 * everyday operations: save one, find one by its id, list them all, count them, delete
 * one. (The {@code Long} is the type of the id used to look records up.)
 *
 * <p>The methods below are extra, custom look-ups. We don't write their inner workings —
 * the framework reads the method <i>name</i> and figures out the matching database query.
 * So "findByStatus" automatically means "find every history record whose status equals the
 * value I pass in." This name-to-query trick is why the methods have no body.
 */
public interface AlarmHistoryRepository extends JpaRepository<AlarmHistory, Long> {

    /**
     * Find the single history record with the given unique business code.
     * Returns an {@code Optional}, which is a safe wrapper meaning "maybe a record, maybe
     * nothing" — it forces the calling code to handle the not-found case instead of crashing.
     */
    Optional<AlarmHistory> findByCode(String code);

    /** List all alarms that happened on one asset, newest first ("OrderByTripTimeDesc"). */
    List<AlarmHistory> findByAssetIdOrderByTripTimeDesc(Long assetId);

    /** List all history records in a particular status (e.g. all the "Open" ones). */
    List<AlarmHistory> findByStatus(String status);
}
