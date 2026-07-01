package com.rpulse.backend.alarmadmin.web;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.rpulse.backend.alarmadmin.engine.ActiveAlarm;
import com.rpulse.backend.alarmadmin.engine.AlarmEngineService;
import com.rpulse.backend.alarmadmin.entity.AlarmHistory;

/**
 * The Active Alarms screen. An alarm moves through three stages:
 *
 * <ol>
 *   <li><b>ACTIVE</b> — it just tripped and nobody has touched it yet.</li>
 *   <li><b>ACKED</b> — someone acknowledged it (confirmed they've seen it). It's
 *       still going off; acknowledging just says "we know about this".</li>
 *   <li><b>CLEARED</b> — it's resolved and removed from the active list, either
 *       because the reading returned to normal or because an operator force-cleared it.</li>
 * </ol>
 *
 * <p>Listing runs a <em>live evaluation</em> through the {@link AlarmEngineService}: opening
 * the screen re-checks every enabled rule against current rTruth values, so the list is
 * fresh and any newly-firing alarm is recorded as a side effect (the same engine the
 * scheduled job uses). Acknowledging and clearing are deliberately two separate actions
 * (two buttons) and both are engine operations. The path {@code {historyId}} is the alarm
 * history <em>code</em>.
 *
 * <p>Reached at web addresses starting with /api/v1/alarms/active.
 */
@RestController
@RequestMapping("/alarms/active")
public class ActiveAlarmController {

    private final AlarmEngineService engine;

    public ActiveAlarmController(AlarmEngineService engine) {
        this.engine = engine;
    }

    /** Live-evaluate all enabled rules and return the alarms currently firing (ACTIVE or ACKED). */
    @GetMapping
    public List<ActiveAlarm> listActive() {
        return engine.evaluate();
    }

    /**
     * Acknowledging an alarm: a request to /api/v1/alarms/active/{historyId}/ack records that
     * a person has seen it (who and when) and moves it to the ACKED stage. The alarm keeps
     * firing — this doesn't resolve it. The optional "userId" says who acknowledged it.
     * Replies "not found" if there's no such alarm.
     */
    @PostMapping("/{historyId}/ack")
    public ResponseEntity<AlarmHistory> acknowledge(@PathVariable String historyId,
                                                    @RequestParam(required = false) Long userId) {
        return engine.acknowledge(historyId, userId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Clearing an alarm: a request to /api/v1/alarms/active/{historyId}/clear resolves it and
     * takes it off the active list — records who cleared it and when, works out how long it
     * lasted, and moves it to the CLEARED stage. An operator can clear an alarm even if the
     * underlying reading is still bad (a manual force-clear). The optional "userId" says who
     * cleared it. Replies "not found" if there's no such alarm.
     */
    @PostMapping("/{historyId}/clear")
    public ResponseEntity<AlarmHistory> clear(@PathVariable String historyId,
                                              @RequestParam(required = false) Long userId) {
        return engine.clear(historyId, userId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}
