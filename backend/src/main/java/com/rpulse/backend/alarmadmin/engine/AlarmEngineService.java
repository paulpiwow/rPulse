package com.rpulse.backend.alarmadmin.engine;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rpulse.backend.alarmadmin.entity.AlarmHistory;
import com.rpulse.backend.alarmadmin.entity.AlarmRule;
import com.rpulse.backend.alarmadmin.entity.NotificationGroup;
import com.rpulse.backend.alarmadmin.entity.SystemMessage;
import com.rpulse.backend.alarmadmin.repository.AlarmHistoryRepository;
import com.rpulse.backend.alarmadmin.repository.AlarmRuleRepository;
import com.rpulse.backend.alarmadmin.repository.AppUserRepository;
import com.rpulse.backend.alarmadmin.repository.SystemMessageRepository;
import com.rpulse.backend.hierarchy.repository.CTagRepository;
import com.rpulse.backend.hierarchy.repository.TagRepository;
import com.rpulse.backend.influx.LocalInfluxStore;
import com.rpulse.backend.influx.TagReading;

/**
 * The alarm evaluation engine — Stage 2 of the scheduler pipeline. It compares every enabled
 * rule against the current value of its watched tag/ctag and drives the alarm lifecycle: ACTIVE
 * (firing) → ACKED (operator has seen it, still firing) → CLEARED (resolved, either
 * automatically when the reading returns to normal or by an operator).
 *
 * <p><b>Where the values come from.</b> Stage 2 reads current values from rPulse's OWN local
 * time-series store via {@link LocalInfluxStore} — never from rTruth or a historian connector on
 * this hot path. Stage 1 (owned by Marshall) is what pulls raw readings in and writes them to the
 * local store; the engine only ever evaluates what Stage 1 last wrote.
 *
 * <p><b>Two entry points, one body.</b> {@link #evaluate()} is called from two places and
 * behaves identically in both:
 * <ul>
 *   <li>the {@link #scheduledEvaluate() scheduled job} (~every 10 seconds), so transitions are
 *       caught even when no screen is open; and</li>
 *   <li>inline from the Operate endpoints (e.g. GET /alarms/active) for freshness the
 *       moment a screen opens.</li>
 * </ul>
 * A {@link ReentrantLock} serialises the two so the in-memory firing map stays consistent.
 *
 * <p><b>Persistence vs. memory.</b> {@link #firingByRule} (rule id → the open history row's
 * id) is the transition detector and lives only in memory; {@code alarm_history} is the
 * durable audit log. After a restart the map is empty, so {@link #openFor} re-adopts any
 * still-open row from the database on first sight of the rule — no duplicate fire is
 * written. One history row is created per fire, its {@code duration_seconds} is refreshed
 * on every evaluation while firing, and finalised at clear.
 *
 * <p><b>Live-data ready.</b> The engine only ever talks to the {@link LocalInfluxStore}
 * interface, so switching from the mock store to a live local Influx (the {@code live} profile)
 * needs no change here.
 */
@Service
public class AlarmEngineService {

    static final String ACTIVE = "ACTIVE";
    static final String ACKED = "ACKED";
    static final String CLEARED = "CLEARED";
    private static final List<String> OPEN_STATUSES = List.of(ACTIVE, ACKED);

    private static final String THRESHOLD = "Threshold";

    private final AlarmRuleRepository ruleRepo;
    private final AlarmHistoryRepository historyRepo;
    private final SystemMessageRepository messageRepo;
    private final AppUserRepository userRepo;
    private final TagRepository tagRepo;
    private final CTagRepository ctagRepo;
    private final LocalInfluxStore localStore;

    /** rule id → id of the open alarm_history row currently firing for that rule. */
    private final Map<Long, Long> firingByRule = new ConcurrentHashMap<>();
    private final ReentrantLock lock = new ReentrantLock();

    public AlarmEngineService(AlarmRuleRepository ruleRepo,
                              AlarmHistoryRepository historyRepo,
                              SystemMessageRepository messageRepo,
                              AppUserRepository userRepo,
                              TagRepository tagRepo,
                              CTagRepository ctagRepo,
                              LocalInfluxStore localStore) {
        this.ruleRepo = ruleRepo;
        this.historyRepo = historyRepo;
        this.messageRepo = messageRepo;
        this.userRepo = userRepo;
        this.tagRepo = tagRepo;
        this.ctagRepo = ctagRepo;
        this.localStore = localStore;
    }

    /** Scheduled entry point — runs the same evaluation as the on-demand path. */
    @Scheduled(fixedRateString = "${rpulse.alarm.evaluate-interval-ms:10000}")
    @Transactional
    public void scheduledEvaluate() {
        evaluate();
    }

    /**
     * Evaluate every enabled rule once. Writes history/message rows as transitions occur
     * and returns the alarms currently firing (ACTIVE or ACKED) with their live values.
     * Safe to call concurrently with the scheduled job.
     */
    @Transactional
    public List<ActiveAlarm> evaluate() {
        return evaluateRules(ruleRepo.findByEnabledTrue());
    }

    /**
     * Same evaluation, scoped to one asset's enabled rules — drives the Asset Alarm Detail
     * screen. Transitions for other assets are left to the scheduled job.
     */
    @Transactional
    public List<ActiveAlarm> evaluateForAsset(Long assetId) {
        List<AlarmRule> rules = ruleRepo.findByAssetId(assetId).stream()
                .filter(AlarmRule::isEnabled)
                .toList();
        return evaluateRules(rules);
    }

    private List<ActiveAlarm> evaluateRules(List<AlarmRule> rules) {
        lock.lock();
        try {
            // Resolve each threshold rule to its series key, then fetch all values at once.
            Map<Long, String> keyByRule = new HashMap<>();
            for (AlarmRule rule : rules) {
                if (!isThreshold(rule)) {
                    continue;
                }
                String key = tagKeyFor(rule);
                if (key != null) {
                    keyByRule.put(rule.getId(), key);
                }
            }
            Set<String> keys = new HashSet<>(keyByRule.values());
            Map<String, TagReading> readings = keys.isEmpty() ? Map.of() : localStore.getLatest(keys);

            List<ActiveAlarm> active = new ArrayList<>();
            for (AlarmRule rule : rules) {
                String key = keyByRule.get(rule.getId());
                if (key == null) {
                    continue;
                }
                TagReading reading = readings.get(key);
                if (reading == null) {
                    continue;
                }
                double value = reading.value();
                AlarmHistory open = openFor(rule.getId());
                if (thresholdFiring(rule, value)) {
                    if (open == null) {
                        open = onNewFire(rule, value);
                    } else {
                        refreshDuration(open);
                    }
                    active.add(toView(open, rule, key, value));
                } else if (open != null) {
                    autoClear(rule.getId(), open);
                }
            }
            return active;
        } finally {
            lock.unlock();
        }
    }

    /**
     * Acknowledge a firing alarm by its history code: records who saw it and when, and moves
     * ACTIVE → ACKED. The alarm keeps firing — ack is "I know", not "it's fixed". Emits an
     * ALARM_STATUS message. No-op if the alarm is already cleared.
     */
    @Transactional
    public Optional<AlarmHistory> acknowledge(String historyCode, Long userId) {
        lock.lock();
        try {
            return historyRepo.findByCode(historyCode).map(history -> {
                if (!CLEARED.equals(history.getStatus())) {
                    Long actor = resolveUser(userId);
                    history.setAcknowledgeTime(OffsetDateTime.now());
                    history.setAcknowledgedByUserId(actor);
                    history.setStatus(ACKED);
                    historyRepo.save(history);
                    writeMessage("ALARM_STATUS", "Alarm acknowledged: " + history.getAlarmName(),
                            "Acknowledged by " + describeActor(actor) + ".", history.getResponsibility());
                }
                return history;
            });
        } finally {
            lock.unlock();
        }
    }

    /**
     * Clear an alarm by its history code: records who cleared it and when, finalises
     * {@code duration_seconds}, and moves the status to CLEARED. Use for an operator
     * force-clear; the engine also clears automatically when a reading returns to normal.
     * Emits an ALARM_STATUS message and drops the alarm from the in-memory firing map.
     */
    @Transactional
    public Optional<AlarmHistory> clear(String historyCode, Long userId) {
        lock.lock();
        try {
            return historyRepo.findByCode(historyCode).map(history -> {
                OffsetDateTime now = OffsetDateTime.now();
                Long actor = resolveUser(userId);
                history.setClearTime(now);
                history.setClearedByUserId(actor);
                if (history.getTripTime() != null) {
                    history.setDurationSeconds((int) Duration.between(history.getTripTime(), now).getSeconds());
                }
                history.setStatus(CLEARED);
                historyRepo.save(history);
                firingByRule.values().removeIf(id -> id.equals(history.getId()));
                writeMessage("ALARM_STATUS", "Alarm cleared: " + history.getAlarmName(),
                        "Cleared by " + describeActor(actor) + ".", history.getResponsibility());
                return history;
            });
        } finally {
            lock.unlock();
        }
    }

    // -----------------------------------------------------------------------
    // Transition helpers
    // -----------------------------------------------------------------------

    /** The open history row for a rule, adopting a still-open row from the DB after a restart. */
    private AlarmHistory openFor(Long ruleId) {
        Long historyId = firingByRule.get(ruleId);
        if (historyId != null) {
            AlarmHistory mapped = historyRepo.findById(historyId).orElse(null);
            if (mapped != null && !CLEARED.equals(mapped.getStatus())) {
                return mapped;
            }
            firingByRule.remove(ruleId);
        }
        AlarmHistory adopted = historyRepo
                .findFirstByAlarmRule_IdAndStatusInOrderByTripTimeDesc(ruleId, OPEN_STATUSES)
                .orElse(null);
        if (adopted != null) {
            firingByRule.put(ruleId, adopted.getId());
        }
        return adopted;
    }

    /** A rule just started firing: write the history row (status ACTIVE) and an ALARM message. */
    private AlarmHistory onNewFire(AlarmRule rule, double value) {
        OffsetDateTime now = OffsetDateTime.now();
        String group = firstGroupName(rule);
        AlarmHistory history = new AlarmHistory();
        history.setCode("ALMH-" + UUID.randomUUID());
        history.setAlarmRule(rule);
        history.setAssetId(rule.getAssetId());
        history.setAlarmName(rule.getAlarmName());
        history.setSeverity(rule.getSeverity());
        history.setTripTime(now);
        history.setNotificationTime(now);
        history.setDurationSeconds(0);
        history.setResponsibility(group);
        history.setStatus(ACTIVE);
        AlarmHistory saved = historyRepo.save(history);
        firingByRule.put(rule.getId(), saved.getId());
        writeMessage("ALARM", "Alarm fired: " + rule.getAlarmName(),
                "Value " + value + " tripped " + describe(rule) + ".", group);
        return saved;
    }

    /** Still firing: keep duration_seconds current. */
    private void refreshDuration(AlarmHistory history) {
        if (history.getTripTime() != null) {
            long seconds = Duration.between(history.getTripTime(), OffsetDateTime.now()).getSeconds();
            history.setDurationSeconds((int) seconds);
            historyRepo.save(history);
        }
    }

    /** Reading returned to normal: finalise and clear (system-initiated, no user). */
    private void autoClear(Long ruleId, AlarmHistory history) {
        OffsetDateTime now = OffsetDateTime.now();
        history.setClearTime(now);
        if (history.getTripTime() != null) {
            history.setDurationSeconds((int) Duration.between(history.getTripTime(), now).getSeconds());
        }
        history.setStatus(CLEARED);
        historyRepo.save(history);
        firingByRule.remove(ruleId);
        writeMessage("ALARM_STATUS", "Alarm cleared: " + history.getAlarmName(),
                "Reading returned to normal.", history.getResponsibility());
    }

    // -----------------------------------------------------------------------
    // Small helpers
    // -----------------------------------------------------------------------

    private void writeMessage(String source, String title, String body, String target) {
        SystemMessage message = new SystemMessage();
        message.setCode("MSG-" + UUID.randomUUID());
        message.setTitle(title);
        message.setBody(body);
        message.setSource(source);
        message.setTarget(target);
        message.setStatus("Unread");
        messageRepo.save(message);
    }

    /**
     * Record the acting user only if it refers to a real {@code app_user}. Phase 6 runs with
     * a hardcoded {@code admin} and no real user rows, so ack/clear may arrive with a userId
     * that doesn't exist (or none at all); rather than fail the FK to app_user, we drop it to
     * null. The ack_by/clear_by columns are nullable by design.
     */
    private Long resolveUser(Long userId) {
        return (userId != null && userRepo.existsById(userId)) ? userId : null;
    }

    private static String describeActor(Long userId) {
        return userId == null ? "operator" : "user " + userId;
    }

    private String firstGroupName(AlarmRule rule) {
        return rule.getNotifyGroups().stream()
                .findFirst()
                .map(NotificationGroup::getGroupName)
                .orElse(null);
    }

    /** Phase 6 evaluates Threshold rules only; Rate of Change / Combinatorial are future work. */
    private static boolean isThreshold(AlarmRule rule) {
        return THRESHOLD.equalsIgnoreCase(rule.getAlarmType());
    }

    /** Resolve a rule's watched target to its Influx series key (the tag/ctag {@code code}). */
    private String tagKeyFor(AlarmRule rule) {
        Long watchedId = rule.getWatchedTagId();
        if (watchedId == null || rule.getWatchedKind() == null) {
            return null;
        }
        return switch (rule.getWatchedKind()) {
            case TAG -> tagRepo.findById(watchedId).map(t -> t.getCode()).orElse(null);
            case CTAG -> ctagRepo.findById(watchedId).map(c -> c.getCode()).orElse(null);
        };
    }

    private static boolean thresholdFiring(AlarmRule rule, double value) {
        if (rule.getThresholdValue() == null) {
            return false;
        }
        double threshold = rule.getThresholdValue().doubleValue();
        return switch (normalizeOperator(rule.getOperator())) {
            case "GT" -> value > threshold;
            case "LT" -> value < threshold;
            case "GTE" -> value >= threshold;
            case "LTE" -> value <= threshold;
            case "EQ" -> value == threshold;
            default -> false;
        };
    }

    /** Accept both the stored symbols ({@code > < = >= <=}) and the spec tokens. */
    private static String normalizeOperator(String operator) {
        if (operator == null) {
            return "";
        }
        return switch (operator.trim()) {
            case ">", "GT" -> "GT";
            case "<", "LT" -> "LT";
            case ">=", "GTE" -> "GTE";
            case "<=", "LTE" -> "LTE";
            case "=", "==", "EQ" -> "EQ";
            default -> operator.trim().toUpperCase();
        };
    }

    private static String describe(AlarmRule rule) {
        return normalizeOperator(rule.getOperator()) + " " + rule.getThresholdValue();
    }

    private ActiveAlarm toView(AlarmHistory history, AlarmRule rule, String tagKey, double value) {
        return new ActiveAlarm(
                history.getCode(),
                rule.getCode(),
                history.getAssetId(),
                history.getAlarmName(),
                history.getSeverity(),
                history.getStatus(),
                tagKey,
                value,
                rule.getThresholdValue(),
                normalizeOperator(rule.getOperator()),
                history.getTripTime(),
                history.getAcknowledgeTime(),
                history.getDurationSeconds());
    }
}
