package com.rpulse.backend.alarmadmin.web;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.rpulse.backend.alarmadmin.entity.AlarmRule;
import com.rpulse.backend.alarmadmin.entity.AppUser;
import com.rpulse.backend.alarmadmin.entity.NotificationGroup;
import com.rpulse.backend.alarmadmin.repository.AlarmRuleRepository;
import com.rpulse.backend.alarmadmin.repository.AppUserRepository;
import com.rpulse.backend.alarmadmin.repository.NotificationGroupRepository;

/**
 * Handles all the web requests for alarms — the Alarm Configuration screen and the
 * Alarm List. It lets the app list alarms, look one up, add one, change one, and
 * remove one.
 *
 * <p>This is the most involved controller in this group, because an alarm also records
 * which groups and people to notify. So it works with the "travel form" of an alarm
 * ({@link AlarmRuleDto}) instead of the raw stored record: the travel form carries the
 * notify lists as simple id numbers, and the helper methods below convert between the
 * two. The requests are marked "transactional" so the database connection stays open
 * while those notify lists are gathered.
 *
 * <p>All of this is reached at web addresses starting with /api/alarms.
 */
@RestController
@RequestMapping("/api/alarms")
public class AlarmRuleController {

    private final AlarmRuleRepository alarmRepository;
    private final NotificationGroupRepository groupRepository;
    private final AppUserRepository userRepository;

    // The app hands this controller three "filing cabinets": alarms, plus groups and
    // users so it can look up who an alarm should notify.
    public AlarmRuleController(AlarmRuleRepository alarmRepository,
                              NotificationGroupRepository groupRepository,
                              AppUserRepository userRepository) {
        this.alarmRepository = alarmRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
    }

    /**
     * Asking for /api/alarms gives back the full list of alarms (in travel form). If you
     * add "?assetId=" with an asset's id, it gives back only the alarms on that asset
     * (for example /api/alarms?assetId=1).
     */
    @GetMapping
    @Transactional(readOnly = true)
    public List<AlarmRuleDto> list(@RequestParam(required = false) Long assetId) {
        List<AlarmRule> alarms = assetId == null
            ? alarmRepository.findAll()
            : alarmRepository.findByAssetId(assetId);
        return alarms.stream().map(AlarmRuleController::toDto).toList();
    }

    /** Asking for /api/alarms/{id} gives back that one alarm, or a "not found" reply. */
    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<AlarmRuleDto> getOne(@PathVariable Long id) {
        return alarmRepository.findById(id)
            .map(alarm -> ResponseEntity.ok(toDto(alarm)))
            .orElse(ResponseEntity.notFound().build());
    }

    /** Sending a new alarm to /api/alarms saves it and replies that it was created. */
    @PostMapping
    @Transactional
    public ResponseEntity<AlarmRuleDto> create(@RequestBody AlarmRuleDto body) {
        AlarmRule alarm = new AlarmRule();
        applyToEntity(body, alarm);
        AlarmRule saved = alarmRepository.save(alarm);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved));
    }

    /**
     * Sending updated details to /api/alarms/{id} overwrites that alarm with the new
     * values, including its notify lists. Replies "not found" if it doesn't exist.
     */
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<AlarmRuleDto> update(@PathVariable Long id,
                                               @RequestBody AlarmRuleDto body) {
        return alarmRepository.findById(id)
            .map(existing -> {
                applyToEntity(body, existing);
                return ResponseEntity.ok(toDto(alarmRepository.save(existing)));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /** Asking to delete /api/alarms/{id} removes that alarm, or replies "not found". */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!alarmRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        alarmRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // -----------------------------------------------------------------------
    // Helpers that convert between the stored alarm record and its travel form.
    // -----------------------------------------------------------------------

    /** Turn a stored alarm record into the travel form sent over the web. */
    private static AlarmRuleDto toDto(AlarmRule a) {
        List<Long> groupIds = a.getNotifyGroups().stream().map(NotificationGroup::getId).toList();
        List<Long> userIds = a.getNotifyUsers().stream().map(AppUser::getId).toList();
        return new AlarmRuleDto(
            a.getId(), a.getCode(), a.getAssetId(), a.getAlarmName(), a.getAlarmType(),
            a.isEnabled(), a.getSeverity(), a.getTagId(), a.getCtagId(),
            a.getOperator(), a.getThresholdValue(), a.getRateValue(),
            a.getRateUnit(), a.getRatePeriod(), a.getLogicFormula(),
            groupIds, userIds);
    }

    /** Copy the values from a travel form onto a stored alarm record, looking up the notify lists. */
    private void applyToEntity(AlarmRuleDto d, AlarmRule a) {
        a.setCode(d.code());
        a.setAssetId(d.assetId());
        a.setAlarmName(d.alarmName());
        a.setAlarmType(d.alarmType());
        a.setEnabled(d.enabled());
        a.setSeverity(d.severity());
        a.setTagId(d.tagId());
        a.setCtagId(d.ctagId());
        a.setOperator(d.operator());
        a.setThresholdValue(d.thresholdValue());
        a.setRateValue(d.rateValue());
        a.setRateUnit(d.rateUnit());
        a.setRatePeriod(d.ratePeriod());
        a.setLogicFormula(d.logicFormula());
        a.setNotifyGroups(lookUpGroups(d.notifyGroupIds()));
        a.setNotifyUsers(lookUpUsers(d.notifyUserIds()));
    }

    /** Find the real group records for the given ids (empty list is fine). */
    private Set<NotificationGroup> lookUpGroups(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return new HashSet<>();
        }
        return new HashSet<>(groupRepository.findAllById(ids));
    }

    /** Find the real user records for the given ids (empty list is fine). */
    private Set<AppUser> lookUpUsers(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return new HashSet<>();
        }
        return new HashSet<>(userRepository.findAllById(ids));
    }
}
