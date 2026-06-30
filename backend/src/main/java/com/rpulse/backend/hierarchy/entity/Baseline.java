package com.rpulse.backend.hierarchy.entity;

import java.math.BigDecimal;

import com.rpulse.backend.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * A baseline rule, mapped to the {@code baseline_rule} table in
 * {@code V2__hierarchy.sql}. A rule always belongs to an {@link Asset} and
 * applies at one of three scopes — {@code Asset}, {@code Tag} or {@code CTag}.
 *
 * <p><strong>Scope/target invariant (DB CHECK {@code chk_baseline_scope_target}):</strong>
 * exactly one target is set to match {@link #scope}:
 * <ul>
 *   <li>{@code scope = "Asset"} → both {@link #tag} and {@link #ctag} are null</li>
 *   <li>{@code scope = "Tag"}   → {@link #tag} set, {@link #ctag} null</li>
 *   <li>{@code scope = "CTag"}  → {@link #ctag} set, {@link #tag} null</li>
 * </ul>
 * Violating this fails the insert/update at the database, so callers must keep
 * scope and target consistent. The shared {@code id}, {@code code} and audit
 * columns come from {@link BaseEntity}.
 */
@Entity
@Table(name = "baseline_rule")
public class Baseline extends BaseEntity {

    /** Asset | Tag | CTag — selects which target FK must be set (see class doc). */
    @Column(name = "scope", nullable = false, length = 16)
    private String scope;

    /** asset_id BIGINT NOT NULL REFERENCES asset(id) ON DELETE CASCADE. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "asset_id", nullable = false)
    private Asset asset;

    /** Set only when {@link #scope} is "Tag". */
    @ManyToOne
    @JoinColumn(name = "tag_id")
    private Tag tag;

    /** Set only when {@link #scope} is "CTag". */
    @ManyToOne
    @JoinColumn(name = "ctag_id")
    private CTag ctag;

    @Column(name = "measurement_type")
    private String measurementType;

    @Column(name = "unit")
    private String unit;

    @Column(name = "baseline_low", precision = 18, scale = 4)
    private BigDecimal baselineLow;

    @Column(name = "baseline_target", precision = 18, scale = 4)
    private BigDecimal baselineTarget;

    @Column(name = "baseline_high", precision = 18, scale = 4)
    private BigDecimal baselineHigh;

    @Column(name = "baseline_std_dev", precision = 18, scale = 4)
    private BigDecimal baselineStdDev;

    /** "15m", "5m" */
    @Column(name = "evaluation_window")
    private String evaluationWindow;

    /** "2 min" */
    @Column(name = "warning_delay")
    private String warningDelay;

    @Column(name = "enabled", nullable = false)
    private boolean enabled = true;

    /** Responsible group name. */
    @Column(name = "owner")
    private String owner;

    public String getScope() {
        return scope;
    }

    public void setScope(String scope) {
        this.scope = scope;
    }

    public Asset getAsset() {
        return asset;
    }

    public void setAsset(Asset asset) {
        this.asset = asset;
    }

    public Tag getTag() {
        return tag;
    }

    public void setTag(Tag tag) {
        this.tag = tag;
    }

    public CTag getCtag() {
        return ctag;
    }

    public void setCtag(CTag ctag) {
        this.ctag = ctag;
    }

    public String getMeasurementType() {
        return measurementType;
    }

    public void setMeasurementType(String measurementType) {
        this.measurementType = measurementType;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public BigDecimal getBaselineLow() {
        return baselineLow;
    }

    public void setBaselineLow(BigDecimal baselineLow) {
        this.baselineLow = baselineLow;
    }

    public BigDecimal getBaselineTarget() {
        return baselineTarget;
    }

    public void setBaselineTarget(BigDecimal baselineTarget) {
        this.baselineTarget = baselineTarget;
    }

    public BigDecimal getBaselineHigh() {
        return baselineHigh;
    }

    public void setBaselineHigh(BigDecimal baselineHigh) {
        this.baselineHigh = baselineHigh;
    }

    public BigDecimal getBaselineStdDev() {
        return baselineStdDev;
    }

    public void setBaselineStdDev(BigDecimal baselineStdDev) {
        this.baselineStdDev = baselineStdDev;
    }

    public String getEvaluationWindow() {
        return evaluationWindow;
    }

    public void setEvaluationWindow(String evaluationWindow) {
        this.evaluationWindow = evaluationWindow;
    }

    public String getWarningDelay() {
        return warningDelay;
    }

    public void setWarningDelay(String warningDelay) {
        this.warningDelay = warningDelay;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getOwner() {
        return owner;
    }

    public void setOwner(String owner) {
        this.owner = owner;
    }
}
