package com.rpulse.backend.alarmadmin.repository;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    /** List all history records in a particular status (e.g. all the "ACTIVE" ones). */
    List<AlarmHistory> findByStatus(String status);

    /**
     * The most recent still-open history row for a given rule, used by the engine to
     * re-adopt a firing alarm after a restart (when the in-memory map is empty) instead of
     * writing a duplicate. {@code AlarmRule_Id} traverses the alarm_rule link to its id.
     */
    Optional<AlarmHistory> findFirstByAlarmRule_IdAndStatusInOrderByTripTimeDesc(
            Long alarmRuleId, Collection<String> statuses);

    /**
     * Paginated history search for the Alarm History screen, newest first. Every filter is
     * optional: a null {@code assetId}/{@code from}/{@code to} drops that predicate. A native
     * query with explicit casts is used because Postgres can't infer the type of a bare
     * {@code :param is null} check on an untyped NULL bind; the {@code cast(... as ...)} gives
     * each parameter a concrete type. Ordering is in the query, so the {@code Pageable} carries
     * only page/size.
     */
    @Query(value = """
            select * from alarm_history
            where (cast(:assetId as bigint) is null or asset_id = :assetId)
              and (cast(:from as timestamptz) is null or trip_time >= :from)
              and (cast(:to as timestamptz) is null or trip_time <= :to)
            order by trip_time desc
            """,
            countQuery = """
            select count(*) from alarm_history
            where (cast(:assetId as bigint) is null or asset_id = :assetId)
              and (cast(:from as timestamptz) is null or trip_time >= :from)
              and (cast(:to as timestamptz) is null or trip_time <= :to)
            """,
            nativeQuery = true)
    Page<AlarmHistory> search(@Param("assetId") Long assetId,
                              @Param("from") OffsetDateTime from,
                              @Param("to") OffsetDateTime to,
                              Pageable pageable);
}
