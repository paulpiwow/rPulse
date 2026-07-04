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
import com.rpulse.backend.alarmadmin.entity.AppUser;
import com.rpulse.backend.alarmadmin.repository.AppUserRepository;
import com.rpulse.backend.hierarchy.repository.AssetRepository;

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
 * the screen re-checks every enabled rule against current local-Influx values, so the list is
 * fresh and any newly-firing alarm is recorded as a side effect (the same engine the
 * scheduled job uses). Acknowledging and clearing are deliberately two separate actions
 * (two buttons) and both are engine operations. As everywhere in the API, path and query
 * parameters are business <em>codes</em>: {@code {historyCode}} is the alarm history code,
 * {@code {assetCode}} the asset code, and {@code userCode} the acting user's code.
 *
 * <p>Reached at web addresses starting with /api/v1/alarms/active.
 */
@RestController
@RequestMapping("/alarms/active")
public class ActiveAlarmController {

    private final AlarmEngineService engine;
    private final AssetRepository assets;
    private final AppUserRepository users;

    public ActiveAlarmController(AlarmEngineService engine, AssetRepository assets,
                                 AppUserRepository users) {
        this.engine = engine;
        this.assets = assets;
        this.users = users;
    }

    /** Live-evaluate all enabled rules and return the alarms currently firing (ACTIVE or ACKED). */
    @GetMapping
    public List<ActiveAlarm> listActive() {
        return engine.evaluate();
    }

    /**
     * Live-evaluate one asset's rules — the Asset Alarm Detail screen. {@code assetCode} is
     * the asset <em>code</em> (e.g. AST-DCT). Replies "not found" if no such asset exists.
     */
    @GetMapping("/{assetCode}")
    public ResponseEntity<List<ActiveAlarm>> listActiveForAsset(@PathVariable String assetCode) {
        return assets.findByCode(assetCode)
            .map(asset -> ResponseEntity.ok(engine.evaluateForAsset(asset.getId())))
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Acknowledging an alarm: a request to /api/v1/alarms/active/{historyCode}/ack records
     * that a person has seen it (who and when) and moves it to the ACKED stage. The alarm
     * keeps firing — this doesn't resolve it. The optional "userCode" says who acknowledged
     * it. Replies "not found" if there's no such alarm.
     */
    @PostMapping("/{historyCode}/ack")
    public ResponseEntity<AlarmHistory> acknowledge(@PathVariable String historyCode,
                                                    @RequestParam(required = false) String userCode) {
        return engine.acknowledge(historyCode, resolveUserId(userCode))
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Clearing an alarm: a request to /api/v1/alarms/active/{historyCode}/clear resolves it
     * and takes it off the active list — records who cleared it and when, works out how long
     * it lasted, and moves it to the CLEARED stage. An operator can clear an alarm even if
     * the underlying reading is still bad (a manual force-clear). The optional "userCode"
     * says who cleared it. Replies "not found" if there's no such alarm.
     */
    @PostMapping("/{historyCode}/clear")
    public ResponseEntity<AlarmHistory> clear(@PathVariable String historyCode,
                                              @RequestParam(required = false) String userCode) {
        return engine.clear(historyCode, resolveUserId(userCode))
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * The acting user's code → the stored id the history row records. Deliberately lenient
     * (unknown or missing code → null), matching the engine: Phase 6 runs with a hardcoded
     * login and may not have real user rows, and ack_by/clear_by are nullable by design.
     */
    private Long resolveUserId(String userCode) {
        if (userCode == null) {
            return null;
        }
        return users.findByCode(userCode).map(AppUser::getId).orElse(null);
    }
}
