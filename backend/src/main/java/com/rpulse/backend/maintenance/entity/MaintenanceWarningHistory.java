package com.rpulse.backend.maintenance.entity;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import com.rpulse.backend.common.BaseEntity;
import com.rpulse.backend.hierarchy.entity.Baseline;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * A record of a maintenance warning that actually happened — the log book of past
 * baseline drifts.
 *
 * <p>Plain-English picture: a {@link Baseline} is the "here's what normal looks
 * like for this tag" setting (its usual low, high, average, and how much it
 * normally wiggles). A MaintenanceWarningHistory row is what gets written down the
 * moment a live reading strays outside that normal range. So one baseline can
 * produce many warning rows over time, one for each time the reading drifted.
 *
 * <p>This is the maintenance twin of {@code AlarmHistory}, and it is kept
 * deliberately separate on purpose: an alarm comes from a rule a person sets up,
 * while a maintenance warning comes from a tag straying from its own baseline.
 * Different causes, different tables, so the two ideas never get confused.
 *
 * <p>These rows are created automatically by the maintenance-warning engine as
 * drifts happen — nobody types them in by hand. Unlike alarms, a warning does NOT
 * send a message on its own; a message is only ever produced when an operator hits
 * the explicit "Notify" button on the warnings screen.
 *
 * <p>"extends BaseEntity" means this automatically gets the shared columns every
 * stored item has: a database id, a unique business code, and created/updated
 * timestamps. See {@link BaseEntity} for the details.
 */
@Entity
@Table(name = "maintenance_warning_history")
public class MaintenanceWarningHistory extends BaseEntity {

    /**
     * Which baseline this warning came from.
     *
     * <p>"ManyToOne" in plain terms: many warning rows can point back to one
     * baseline. "fetch = LAZY" means don't load the whole baseline from the
     * database unless the code actually asks for it. The link is allowed to be
     * empty — if someone later deletes the baseline we clear the link but keep this
     * row, because the record that "this drift happened" should outlive the setting
     * that caused it. "@JsonIgnore" keeps the full baseline out of what we send over
     * the web; the row already copies the numbers it needs onto itself.
     */
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "baseline_id")
    private Baseline baseline;

    /** The id number of the asset (e.g. a specific pump or tank) this warning was on. */
    @Column(name = "asset_id")
    private Long assetId;

    /** The tag/ctag series key that drifted — copied in so the record reads clearly on its own. */
    @Column(name = "tag_code", nullable = false, length = 64)
    private String tagCode;

    /** Whether the drifted series was a plain Tag or a computed CTag. */
    @Column(name = "scope", length = 16)
    private String scope;

    /** The actual reading that broke out of the normal range. */
    @Column(name = "observed_value", precision = 18, scale = 4)
    private BigDecimal observedValue;

    /** Snapshot of the baseline's lower bound at the moment this warning fired. */
    @Column(name = "baseline_low", precision = 18, scale = 4)
    private BigDecimal baselineLow;

    /** Snapshot of the baseline's upper bound at the moment this warning fired. */
    @Column(name = "baseline_high", precision = 18, scale = 4)
    private BigDecimal baselineHigh;

    /** Snapshot of the baseline's average/target at the moment this warning fired. */
    @Column(name = "baseline_target", precision = 18, scale = 4)
    private BigDecimal baselineTarget;

    /** Snapshot of the baseline's standard deviation at the moment this warning fired. */
    @Column(name = "baseline_std_dev", precision = 18, scale = 4)
    private BigDecimal baselineStdDev;

    /** The N that was used in the "mean plus or minus N standard deviations" check. */
    @Column(name = "std_dev_multiplier", precision = 18, scale = 4)
    private BigDecimal stdDevMultiplier;

    /** Which way the reading strayed: ABOVE (too high) or BELOW (too low). */
    @Column(name = "direction", length = 16)
    private String direction;

    /**
     * Which bound the reading broke: RANGE (the plain low/high), STDDEV (the
     * mean plus-or-minus N standard deviations band), or BOTH.
     */
    @Column(name = "basis", length = 16)
    private String basis;

    /** The name of the group or team responsible for this tag (copied from the baseline). */
    @Column(name = "owner")
    private String owner;

    /** The exact moment the reading first drifted outside the normal range. */
    @Column(name = "trip_time")
    private OffsetDateTime tripTime;

    /** How long the drift lasted, measured in seconds. */
    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    /**
     * Where this warning stands in its life cycle. It starts ACTIVE while the
     * reading is still outside the range, and becomes CLEARED once the reading
     * returns to normal.
     */
    @Column(name = "status", length = 32)
    private String status;

    /** The moment the reading returned to normal and this warning was cleared. Empty until then. */
    @Column(name = "clear_time")
    private OffsetDateTime clearTime;

    // -----------------------------------------------------------------------
    // Getters and setters — the standard, boilerplate way the rest of the app
    // reads and writes each field above. No extra logic lives here.
    // -----------------------------------------------------------------------

    public Baseline getBaseline() {
        return baseline;
    }

    public void setBaseline(Baseline baseline) {
        this.baseline = baseline;
    }

    public Long getAssetId() {
        return assetId;
    }

    public void setAssetId(Long assetId) {
        this.assetId = assetId;
    }

    public String getTagCode() {
        return tagCode;
    }

    public void setTagCode(String tagCode) {
        this.tagCode = tagCode;
    }

    public String getScope() {
        return scope;
    }

    public void setScope(String scope) {
        this.scope = scope;
    }

    public BigDecimal getObservedValue() {
        return observedValue;
    }

    public void setObservedValue(BigDecimal observedValue) {
        this.observedValue = observedValue;
    }

    public BigDecimal getBaselineLow() {
        return baselineLow;
    }

    public void setBaselineLow(BigDecimal baselineLow) {
        this.baselineLow = baselineLow;
    }

    public BigDecimal getBaselineHigh() {
        return baselineHigh;
    }

    public void setBaselineHigh(BigDecimal baselineHigh) {
        this.baselineHigh = baselineHigh;
    }

    public BigDecimal getBaselineTarget() {
        return baselineTarget;
    }

    public void setBaselineTarget(BigDecimal baselineTarget) {
        this.baselineTarget = baselineTarget;
    }

    public BigDecimal getBaselineStdDev() {
        return baselineStdDev;
    }

    public void setBaselineStdDev(BigDecimal baselineStdDev) {
        this.baselineStdDev = baselineStdDev;
    }

    public BigDecimal getStdDevMultiplier() {
        return stdDevMultiplier;
    }

    public void setStdDevMultiplier(BigDecimal stdDevMultiplier) {
        this.stdDevMultiplier = stdDevMultiplier;
    }

    public String getDirection() {
        return direction;
    }

    public void setDirection(String direction) {
        this.direction = direction;
    }

    public String getBasis() {
        return basis;
    }

    public void setBasis(String basis) {
        this.basis = basis;
    }

    public String getOwner() {
        return owner;
    }

    public void setOwner(String owner) {
        this.owner = owner;
    }

    public OffsetDateTime getTripTime() {
        return tripTime;
    }

    public void setTripTime(OffsetDateTime tripTime) {
        this.tripTime = tripTime;
    }

    public Integer getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(Integer durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public OffsetDateTime getClearTime() {
        return clearTime;
    }

    public void setClearTime(OffsetDateTime clearTime) {
        this.clearTime = clearTime;
    }
}
