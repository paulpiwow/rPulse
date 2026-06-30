package com.rpulse.backend.alarmadmin.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rpulse.backend.alarmadmin.entity.AlarmRule;

/**
 * The "filing cabinet" for AlarmRule records — how the app saves, finds, and deletes
 * alarm settings.
 *
 * <p>By extending {@code JpaRepository<AlarmRule, Long>}, the framework hands us all the
 * everyday operations for free (save, find by id, list all, delete, count). The methods
 * below add custom look-ups: the framework reads each method name and builds the matching
 * database query automatically, which is why they have no body. See
 * {@link AlarmHistoryRepository} for a fuller explanation of how that works.
 */
public interface AlarmRuleRepository extends JpaRepository<AlarmRule, Long> {

    /** Find the one alarm rule with this unique business code. {@code Optional} = "maybe found, maybe not". */
    Optional<AlarmRule> findByCode(String code);

    /** List every alarm rule set up on a particular asset. */
    List<AlarmRule> findByAssetId(Long assetId);

    /** List only the alarm rules that are currently switched on ("EnabledTrue"). */
    List<AlarmRule> findByEnabledTrue();
}
