package com.rpulse.backend.alarmadmin.entity;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

import com.rpulse.backend.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;

/**
 * One alarm setting, exactly as a person fills it in on the Alarm Configuration screen.
 *
 * <p>Plain-English picture: this is the "rule" — the instruction that says "watch this
 * measurement and raise an alarm when such-and-such happens." It is the cause; the
 * {@link AlarmHistory} rows are the effects (the record of each time the rule tripped).
 *
 * <p>One important quirk: a single rule can be one of three different kinds of alarm,
 * and the kind decides which of the fields below are actually used. Think of it like a
 * form where filling in one box greys out the others. The {@code alarmType} field says
 * which kind it is:
 * <ul>
 *   <li><b>Threshold</b> — "alarm when the value crosses a fixed limit." Uses
 *       {@code operator} (e.g. greater-than), {@code thresholdValue}, and a tag or ctag.</li>
 *   <li><b>Rate of Change</b> — "alarm when the value moves too fast." Uses
 *       {@code rateValue}, {@code rateUnit}, {@code ratePeriod}, and a tag or ctag.</li>
 *   <li><b>Combinatorial Logic</b> — "alarm when a custom formula is true." Uses
 *       {@code logicFormula}.</li>
 * </ul>
 *
 * <p>The asset, tag, and ctag all belong to the hierarchy part of the app (Ty's area).
 * A "tag" is a live measured reading (like a temperature sensor); a "ctag" is a computed
 * value worked out from other readings. Those classes don't exist yet, so for now we
 * just store their id numbers. We can upgrade them to real links later if we choose.
 */
@Entity                          // store rows of this class in a database table
@Table(name = "alarm_rule")      // the table is called "alarm_rule"
public class AlarmRule extends BaseEntity {

    /** The id number of the asset (the physical thing) this alarm watches. Required. */
    @Column(name = "asset_id", nullable = false)
    private Long assetId;

    /** The display name the user gives this alarm, e.g. "High suction pressure". Required. */
    @Column(name = "alarm_name", nullable = false)
    private String alarmName;

    /** Which kind of alarm this is. Must be one of: Threshold, Rate of Change, or Combinatorial Logic. */
    @Column(name = "alarm_type", nullable = false, length = 32)
    private String alarmType;

    /** Whether this alarm is currently switched on. Defaults to true (on) when a new rule is created. */
    @Column(name = "enabled", nullable = false)
    private boolean enabled = true;

    /** How serious this alarm is — "red" (critical) or "yellow" (warning). Optional. */
    @Column(name = "severity", length = 16)
    private String severity;

    /**
     * The id of the single series this alarm watches. Used by Threshold and Rate of Change
     * alarms. Whether this id refers to a measured tag or a computed ctag is decided by
     * {@link #watchedKind} — there is no FK constraint here precisely because it can point at
     * either table.
     */
    @Column(name = "watched_tag_id")
    private Long watchedTagId;

    /** Whether {@link #watchedTagId} refers to a {@code TAG} (measured) or a {@code CTAG} (computed). */
    @Enumerated(EnumType.STRING)
    @Column(name = "watched_kind", length = 8)
    private WatchedKind watchedKind;

    // --- Threshold alarm fields (only used when alarmType is "Threshold") ---

    /** The comparison to apply against the threshold: greater than, less than, or equal to. */
    @Column(name = "operator", length = 8)
    private String operator;

    /**
     * The fixed limit the reading is compared to. Stored as a precise decimal number
     * (BigDecimal) so there is no rounding error — important for accurate alarm limits.
     */
    @Column(name = "threshold_value", precision = 18, scale = 4)
    private BigDecimal thresholdValue;

    // --- Rate of Change alarm fields (only used when alarmType is "Rate of Change") ---

    /** How much change triggers the alarm (again a precise decimal). */
    @Column(name = "rate_value", precision = 18, scale = 4)
    private BigDecimal rateValue;

    /** The unit that the rate is measured in. */
    @Column(name = "rate_unit", length = 32)
    private String rateUnit;

    /** The time window the change is measured over: second, minute, hour, or day. */
    @Column(name = "rate_period", length = 16)
    private String ratePeriod;

    // --- Combinatorial Logic alarm fields (only used when alarmType is "Combinatorial Logic") ---

    /** The custom logic formula, written as text, that decides when this alarm fires. */
    @Column(name = "logic_formula")
    private String logicFormula;

    /**
     * The groups of people to notify when this alarm fires.
     *
     * <p>"ManyToMany" means the link goes both ways and is many-to-many: one alarm can
     * notify several groups, and one group can be notified by several alarms. A
     * relationship like that can't fit in a single column, so the database keeps it in a
     * separate connector table — here named "alarm_notify_group" — where each row simply
     * pairs one alarm id with one group id. The "@JoinTable" block below describes that
     * connector table and which columns hold each side's id.
     */
    @ManyToMany
    @JoinTable(
        name = "alarm_notify_group",
        joinColumns = @JoinColumn(name = "alarm_rule_id"),
        inverseJoinColumns = @JoinColumn(name = "group_id"))
    private Set<NotificationGroup> notifyGroups = new HashSet<>();

    /**
     * The individual people to notify when this alarm fires. Works the same way as
     * {@code notifyGroups} above, but through the "alarm_notify_user" connector table.
     */
    @ManyToMany
    @JoinTable(
        name = "alarm_notify_user",
        joinColumns = @JoinColumn(name = "alarm_rule_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id"))
    private Set<AppUser> notifyUsers = new HashSet<>();

    // -----------------------------------------------------------------------
    // Getters and setters — the standard way the rest of the app reads each
    // field (get...) and writes a new value into it (set...).
    // -----------------------------------------------------------------------

    public Long getAssetId() {
        return assetId;
    }

    public void setAssetId(Long assetId) {
        this.assetId = assetId;
    }

    public String getAlarmName() {
        return alarmName;
    }

    public void setAlarmName(String alarmName) {
        this.alarmName = alarmName;
    }

    public String getAlarmType() {
        return alarmType;
    }

    public void setAlarmType(String alarmType) {
        this.alarmType = alarmType;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public Long getWatchedTagId() {
        return watchedTagId;
    }

    public void setWatchedTagId(Long watchedTagId) {
        this.watchedTagId = watchedTagId;
    }

    public WatchedKind getWatchedKind() {
        return watchedKind;
    }

    public void setWatchedKind(WatchedKind watchedKind) {
        this.watchedKind = watchedKind;
    }

    public String getOperator() {
        return operator;
    }

    public void setOperator(String operator) {
        this.operator = operator;
    }

    public BigDecimal getThresholdValue() {
        return thresholdValue;
    }

    public void setThresholdValue(BigDecimal thresholdValue) {
        this.thresholdValue = thresholdValue;
    }

    public BigDecimal getRateValue() {
        return rateValue;
    }

    public void setRateValue(BigDecimal rateValue) {
        this.rateValue = rateValue;
    }

    public String getRateUnit() {
        return rateUnit;
    }

    public void setRateUnit(String rateUnit) {
        this.rateUnit = rateUnit;
    }

    public String getRatePeriod() {
        return ratePeriod;
    }

    public void setRatePeriod(String ratePeriod) {
        this.ratePeriod = ratePeriod;
    }

    public String getLogicFormula() {
        return logicFormula;
    }

    public void setLogicFormula(String logicFormula) {
        this.logicFormula = logicFormula;
    }

    public Set<NotificationGroup> getNotifyGroups() {
        return notifyGroups;
    }

    public void setNotifyGroups(Set<NotificationGroup> notifyGroups) {
        this.notifyGroups = notifyGroups;
    }

    public Set<AppUser> getNotifyUsers() {
        return notifyUsers;
    }

    public void setNotifyUsers(Set<AppUser> notifyUsers) {
        this.notifyUsers = notifyUsers;
    }
}
