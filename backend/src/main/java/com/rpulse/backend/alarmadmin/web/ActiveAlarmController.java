package com.rpulse.backend.alarmadmin.web;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.rpulse.backend.alarmadmin.entity.AlarmHistory;
import com.rpulse.backend.alarmadmin.repository.AlarmHistoryRepository;

/**
 * Handles the two things an operator does to an alarm that has gone off, on the
 * Active Alarms screen. An alarm moves through three stages:
 *
 * <ol>
 *   <li><b>FIRING</b> — it just tripped and nobody has touched it yet.</li>
 *   <li><b>ACKED</b> — someone acknowledged it (confirmed they've seen it). It's
 *       still going off; acknowledging just says "we know about this".</li>
 *   <li><b>CLEARED</b> — it's resolved and removed from the active list, either
 *       because the reading returned to normal or because an operator force-cleared it.</li>
 * </ol>
 *
 * <p>Acknowledging and clearing are deliberately two separate actions (two separate
 * buttons), so each has its own request. These act on rows in the alarm history — the
 * record of alarms that have fired. Reached at web addresses starting with /api/alarms/active.
 */
@RestController
@RequestMapping("/api/alarms/active")
public class ActiveAlarmController {

    private final AlarmHistoryRepository history;

    public ActiveAlarmController(AlarmHistoryRepository history) {
        this.history = history;
    }

    /** Lists the alarms that are still going off (not yet cleared). */
    @GetMapping
    public List<AlarmHistory> listActive() {
        return history.findAll().stream()
            .filter(a -> !"CLEARED".equals(a.getStatus()))
            .toList();
    }

    /**
     * Acknowledging an alarm: a request to /api/alarms/active/{historyId}/acknowledge
     * records that a person has seen it (who and when) and moves it to the ACKED stage.
     * The alarm keeps firing — this doesn't resolve it. The optional "userId" says who
     * acknowledged it. Replies "not found" if there's no such alarm.
     */
    @PostMapping("/{historyId}/acknowledge")
    public ResponseEntity<AlarmHistory> acknowledge(@PathVariable Long historyId,
                                                    @RequestParam(required = false) Long userId) {
        return history.findById(historyId)
            .map(alarm -> {
                alarm.setAcknowledgeTime(OffsetDateTime.now());
                alarm.setAcknowledgedByUserId(userId);
                alarm.setStatus("ACKED");
                return ResponseEntity.ok(history.save(alarm));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Clearing an alarm: a request to /api/alarms/active/{historyId}/clear resolves it
     * and takes it off the active list — records who cleared it and when, works out how
     * long it lasted, and moves it to the CLEARED stage. An operator can clear an alarm
     * even if the underlying reading is still bad (a manual force-clear). The optional
     * "userId" says who cleared it. Replies "not found" if there's no such alarm.
     */
    @PostMapping("/{historyId}/clear")
    public ResponseEntity<AlarmHistory> clear(@PathVariable Long historyId,
                                              @RequestParam(required = false) Long userId) {
        return history.findById(historyId)
            .map(alarm -> {
                OffsetDateTime now = OffsetDateTime.now();
                alarm.setClearTime(now);
                alarm.setClearedByUserId(userId);
                alarm.setStatus("CLEARED");
                if (alarm.getTripTime() != null) {
                    alarm.setDurationSeconds((int) Duration.between(alarm.getTripTime(), now).getSeconds());
                }
                return ResponseEntity.ok(history.save(alarm));
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
