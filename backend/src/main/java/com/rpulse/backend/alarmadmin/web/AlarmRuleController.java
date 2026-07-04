package com.rpulse.backend.alarmadmin.web;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
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
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.rpulse.backend.alarmadmin.entity.AlarmRule;
import com.rpulse.backend.alarmadmin.entity.AppUser;
import com.rpulse.backend.alarmadmin.entity.NotificationGroup;
import com.rpulse.backend.alarmadmin.entity.WatchedKind;
import com.rpulse.backend.alarmadmin.repository.AlarmRuleRepository;
import com.rpulse.backend.alarmadmin.repository.AppUserRepository;
import com.rpulse.backend.alarmadmin.repository.NotificationGroupRepository;
import com.rpulse.backend.hierarchy.entity.Asset;
import com.rpulse.backend.hierarchy.entity.CTag;
import com.rpulse.backend.hierarchy.entity.Tag;
import com.rpulse.backend.hierarchy.repository.AssetRepository;
import com.rpulse.backend.hierarchy.repository.CTagRepository;
import com.rpulse.backend.hierarchy.repository.TagRepository;

/**
 * Handles all the web requests for alarms — the Alarm Configuration screen and the
 * Alarm List. It lets the app list alarms, look one up, add one, change one, and
 * remove one.
 *
 * <p>This is the most involved controller in this group, because an alarm also records
 * which groups and people to notify. So it works with the "travel form" of an alarm
 * ({@link AlarmRuleDto}) instead of the raw stored record: the travel form carries the
 * notify lists — and the parent asset and watched tag/ctag — as business <em>codes</em>,
 * and the helper methods below convert between codes and the ids the database stores.
 * A body that names a code that doesn't exist gets a "bad request" reply. The requests
 * are marked "transactional" so the database connection stays open while those notify
 * lists are gathered.
 *
 * <p>Alarms are configured against an asset, so the collection is reached both flat
 * ({@code /api/v1/alarms}) and nested under its parent asset
 * ({@code /api/v1/assets/{assetCode}/alarms}). Paths are declared per-method rather than
 * with a class-level base so the nested route can live here alongside the flat one.
 */
@RestController
public class AlarmRuleController {

    private final AlarmRuleRepository alarmRepository;
    private final NotificationGroupRepository groupRepository;
    private final AppUserRepository userRepository;
    private final AssetRepository assetRepository;
    private final TagRepository tagRepository;
    private final CTagRepository ctagRepository;

    // The app hands this controller several "filing cabinets": alarms, plus groups and
    // users so it can look up who an alarm should notify, plus the hierarchy ones
    // (assets, tags, ctags) so codes in the travel form can be resolved to stored ids.
    public AlarmRuleController(AlarmRuleRepository alarmRepository,
                              NotificationGroupRepository groupRepository,
                              AppUserRepository userRepository,
                              AssetRepository assetRepository,
                              TagRepository tagRepository,
                              CTagRepository ctagRepository) {
        this.alarmRepository = alarmRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.assetRepository = assetRepository;
        this.tagRepository = tagRepository;
        this.ctagRepository = ctagRepository;
    }

    /** Asking for /api/v1/alarms gives back the full list of alarms (in travel form). */
    @GetMapping("/alarms")
    @Transactional(readOnly = true)
    public List<AlarmRuleDto> list() {
        return alarmRepository.findAll().stream().map(this::toDto).toList();
    }

    /**
     * Asking for /api/v1/assets/{assetCode}/alarms gives back only the alarms configured on
     * that asset (in travel form). Replies "not found" if no such asset exists.
     */
    @GetMapping("/assets/{assetCode}/alarms")
    @Transactional(readOnly = true)
    public ResponseEntity<List<AlarmRuleDto>> listByAsset(@PathVariable String assetCode) {
        return assetRepository.findByCode(assetCode)
            .map(asset -> ResponseEntity.ok(
                alarmRepository.findByAssetId(asset.getId()).stream().map(this::toDto).toList()))
            .orElse(ResponseEntity.notFound().build());
    }

    /** Asking for /api/v1/alarms/{code} gives back that one alarm, or a "not found" reply. */
    @GetMapping("/alarms/{code}")
    @Transactional(readOnly = true)
    public ResponseEntity<AlarmRuleDto> getOne(@PathVariable String code) {
        return alarmRepository.findByCode(code)
            .map(alarm -> ResponseEntity.ok(toDto(alarm)))
            .orElse(ResponseEntity.notFound().build());
    }

    /** Sending a new alarm to /api/v1/alarms saves it and replies that it was created. */
    @PostMapping("/alarms")
    @Transactional
    public ResponseEntity<AlarmRuleDto> create(@RequestBody AlarmRuleDto body) {
        AlarmRule alarm = new AlarmRule();
        applyToEntity(body, alarm);
        AlarmRule saved = alarmRepository.save(alarm);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved));
    }

    /**
     * Sending updated details to /api/v1/alarms/{code} overwrites that alarm with the new
     * values, including its notify lists. Replies "not found" if it doesn't exist.
     */
    @PutMapping("/alarms/{code}")
    @Transactional
    public ResponseEntity<AlarmRuleDto> update(@PathVariable String code,
                                               @RequestBody AlarmRuleDto body) {
        return alarmRepository.findByCode(code)
            .map(existing -> {
                applyToEntity(body, existing);
                return ResponseEntity.ok(toDto(alarmRepository.save(existing)));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /** Asking to delete /api/v1/alarms/{code} removes that alarm, or replies "not found". */
    @DeleteMapping("/alarms/{code}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable String code) {
        return alarmRepository.findByCode(code)
            .map(alarm -> {
                alarmRepository.delete(alarm);
                return ResponseEntity.noContent().<Void>build();
            })
            .orElse(ResponseEntity.notFound().build());
    }

    // -----------------------------------------------------------------------
    // Helpers that convert between the stored alarm record and its travel form.
    // -----------------------------------------------------------------------

    /** Turn a stored alarm record into the travel form sent over the web. */
    private AlarmRuleDto toDto(AlarmRule a) {
        List<String> groupCodes = a.getNotifyGroups().stream().map(NotificationGroup::getCode).toList();
        List<String> userCodes = a.getNotifyUsers().stream().map(AppUser::getCode).toList();
        return new AlarmRuleDto(
            a.getCode(), assetCodeFor(a.getAssetId()), a.getAlarmName(), a.getAlarmType(),
            a.isEnabled(), a.getSeverity(), watchedTagCodeFor(a), a.getWatchedKind(),
            a.getOperator(), a.getThresholdValue(), a.getRateValue(),
            a.getRateUnit(), a.getRatePeriod(), a.getLogicFormula(),
            groupCodes, userCodes);
    }

    /** Copy the values from a travel form onto a stored alarm record, resolving every code. */
    private void applyToEntity(AlarmRuleDto d, AlarmRule a) {
        a.setCode(d.code());
        a.setAssetId(resolveAssetId(d.assetCode()));
        a.setAlarmName(d.alarmName());
        a.setAlarmType(d.alarmType());
        a.setEnabled(d.enabled());
        a.setSeverity(d.severity());
        a.setWatchedTagId(resolveWatchedTagId(d.watchedTagCode(), d.watchedKind()));
        a.setWatchedKind(d.watchedKind());
        a.setOperator(d.operator());
        a.setThresholdValue(d.thresholdValue());
        a.setRateValue(d.rateValue());
        a.setRateUnit(d.rateUnit());
        a.setRatePeriod(d.ratePeriod());
        a.setLogicFormula(d.logicFormula());
        a.setNotifyGroups(lookUpGroups(d.notifyGroupCodes()));
        a.setNotifyUsers(lookUpUsers(d.notifyUserCodes()));
    }

    /** The stored asset id → its code, or null if the alarm has no asset (or it was removed). */
    private String assetCodeFor(Long assetId) {
        if (assetId == null) {
            return null;
        }
        return assetRepository.findById(assetId).map(Asset::getCode).orElse(null);
    }

    /** The stored watched tag/ctag id → its code, or null if unset (or the target was removed). */
    private String watchedTagCodeFor(AlarmRule a) {
        if (a.getWatchedTagId() == null || a.getWatchedKind() == null) {
            return null;
        }
        return switch (a.getWatchedKind()) {
            case TAG -> tagRepository.findById(a.getWatchedTagId()).map(Tag::getCode).orElse(null);
            case CTAG -> ctagRepository.findById(a.getWatchedTagId()).map(CTag::getCode).orElse(null);
        };
    }

    /** An asset code from the travel form → the stored id; "bad request" if no such asset. */
    private Long resolveAssetId(String assetCode) {
        if (assetCode == null) {
            return null;
        }
        return assetRepository.findByCode(assetCode).map(Asset::getId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Unknown asset code: " + assetCode));
    }

    /** A watched tag/ctag code from the travel form → the stored id; "bad request" if unresolvable. */
    private Long resolveWatchedTagId(String watchedTagCode, WatchedKind kind) {
        if (watchedTagCode == null) {
            return null;
        }
        if (kind == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "watchedKind is required when watchedTagCode is set");
        }
        Optional<Long> id = switch (kind) {
            case TAG -> tagRepository.findByCode(watchedTagCode).map(Tag::getId);
            case CTAG -> ctagRepository.findByCode(watchedTagCode).map(CTag::getId);
        };
        return id.orElseThrow(() -> new ResponseStatusException(
            HttpStatus.BAD_REQUEST, "Unknown " + kind + " code: " + watchedTagCode));
    }

    /** Find the real group records for the given codes; "bad request" if any code is unknown. */
    private Set<NotificationGroup> lookUpGroups(List<String> codes) {
        if (codes == null || codes.isEmpty()) {
            return new HashSet<>();
        }
        Set<NotificationGroup> groups = new HashSet<>(groupRepository.findByCodeIn(codes));
        requireAllResolved(codes, groups.size(), "group");
        return groups;
    }

    /** Find the real user records for the given codes; "bad request" if any code is unknown. */
    private Set<AppUser> lookUpUsers(List<String> codes) {
        if (codes == null || codes.isEmpty()) {
            return new HashSet<>();
        }
        Set<AppUser> users = new HashSet<>(userRepository.findByCodeIn(codes));
        requireAllResolved(codes, users.size(), "user");
        return users;
    }

    /** A notify list must not silently shrink: every code sent must name a real record. */
    private static void requireAllResolved(List<String> codes, int found, String what) {
        int distinct = new HashSet<>(codes).size();
        if (found != distinct) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "One or more " + what + " codes are unknown: " + codes);
        }
    }
}
