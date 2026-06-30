package com.rpulse.backend.alarmadmin.entity;

import java.time.OffsetDateTime;

import com.rpulse.backend.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * A record of an alarm that actually went off — the log book of past alarms.
 *
 * <p>Plain-English picture: an {@link AlarmRule} is the "if this happens, raise an
 * alarm" setting that a person configures. An AlarmHistory row is what gets written
 * down the moment that condition is met. So one rule ("warn me if this pump gets too
 * hot") can produce many history rows over time, one for each time it tripped.
 *
 * <p>These rows are created automatically by the system's alarm engine as events
 * happen — people don't type them in by hand. We still describe it to the program
 * as a normal stored item (an "entity") so the screens can list and filter it.
 *
 * <p>A couple of design notes worth knowing:
 * <ul>
 *   <li>The link back to the originating rule is allowed to be empty. If someone
 *       later deletes the rule, we clear the link but keep the history row, because
 *       the record of "this alarm happened" should survive even if the setting that
 *       caused it is gone.</li>
 *   <li>The asset (the physical thing being monitored, like a pump or tank) lives in
 *       a different part of the app that another teammate, Ty, owns. Rather than link
 *       directly to it, we just store its id number for now.</li>
 * </ul>
 *
 * <p>"extends BaseEntity" means this automatically gets the shared columns every
 * stored item has: a database id, a unique business code, and created/updated
 * timestamps. See {@link BaseEntity} for the details.
 */
@Entity                              // tells the framework: store rows of this class in a database table
@Table(name = "alarm_history")       // the table is literally called "alarm_history"
public class AlarmHistory extends BaseEntity {

    /**
     * Which alarm rule produced this record.
     *
     * <p>"ManyToOne" describes the relationship in plain terms: many history rows can
     * point back to one rule. "fetch = LAZY" is a performance choice — it means don't
     * bother loading the full rule from the database unless the code actually asks for
     * it. The "alarm_rule_id" column simply holds the id number of the linked rule, and
     * it may be empty if that rule was later deleted.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alarm_rule_id")
    private AlarmRule alarmRule;

    /** The id number of the asset (e.g. a specific pump or tank) this alarm was on. */
    @Column(name = "asset_id")
    private Long assetId;

    /** A human-readable name for the alarm, copied in so the history reads clearly on its own. */
    @Column(name = "alarm_name", nullable = false)   // nullable = false: this value is required
    private String alarmName;

    /** How serious the alarm was — typically "red" (critical) or "yellow" (warning). */
    @Column(name = "severity", length = 16)
    private String severity;

    /** The exact moment the alarm condition was first met ("tripped"). */
    @Column(name = "trip_time")
    private OffsetDateTime tripTime;

    /** The moment notifications (email/SMS) were sent out about this alarm. */
    @Column(name = "notification_time")
    private OffsetDateTime notificationTime;

    /** The moment a person acknowledged the alarm — i.e. confirmed they saw it. */
    @Column(name = "acknowledge_time")
    private OffsetDateTime acknowledgeTime;

    /** How long the alarm condition lasted, measured in seconds. */
    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    /** The name of the group or team assigned to deal with this alarm. */
    @Column(name = "responsibility")
    private String responsibility;

    /** Where this alarm stands in its life cycle: Open, Not Started, Resolved, or Reviewed. */
    @Column(name = "status", length = 32)
    private String status;

    // -----------------------------------------------------------------------
    // Getters and setters.
    // These are the standard, boilerplate way Java code reads and writes each
    // field above. A "getter" hands back the current value; a "setter" stores a
    // new one. They carry no extra logic here — they exist because the framework
    // and the rest of the app reach the data through these methods.
    // -----------------------------------------------------------------------

    public AlarmRule getAlarmRule() {
        return alarmRule;
    }

    public void setAlarmRule(AlarmRule alarmRule) {
        this.alarmRule = alarmRule;
    }

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

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public OffsetDateTime getTripTime() {
        return tripTime;
    }

    public void setTripTime(OffsetDateTime tripTime) {
        this.tripTime = tripTime;
    }

    public OffsetDateTime getNotificationTime() {
        return notificationTime;
    }

    public void setNotificationTime(OffsetDateTime notificationTime) {
        this.notificationTime = notificationTime;
    }

    public OffsetDateTime getAcknowledgeTime() {
        return acknowledgeTime;
    }

    public void setAcknowledgeTime(OffsetDateTime acknowledgeTime) {
        this.acknowledgeTime = acknowledgeTime;
    }

    public Integer getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(Integer durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public String getResponsibility() {
        return responsibility;
    }

    public void setResponsibility(String responsibility) {
        this.responsibility = responsibility;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
