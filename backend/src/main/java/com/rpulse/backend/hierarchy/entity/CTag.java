package com.rpulse.backend.hierarchy.entity;

import com.rpulse.backend.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * A computed tag belonging to an {@link Asset}, mapped to the {@code ctag}
 * table in {@code V2__hierarchy.sql}. A ctag is derived from other tags via its
 * {@code expression} over {@code sourceTagIds}. The shared {@code id},
 * {@code code} and audit columns come from {@link BaseEntity}.
 */
@Entity
@Table(name = "ctag")
public class CTag extends BaseEntity {

    /** asset_id BIGINT NOT NULL REFERENCES asset(id) ON DELETE CASCADE. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "asset_id", nullable = false)
    private Asset asset;

    @Column(name = "tag_name", nullable = false)
    private String tagName;

    /**
     * The native ctag name as it lands in Influx — the raw series key the computed value is
     * written under (which may differ from the human-facing {@link #tagName} and from the
     * business {@code code}).
     */
    @Column(name = "ctag_key")
    private String ctagKey;

    @Column(name = "measurement_type")
    private String measurementType;

    @Column(name = "unit")
    private String unit;

    @Column(name = "sampling_rate")
    private String samplingRate;

    /** Algebraic | Standard Deviation | ... */
    @Column(name = "calculation_type")
    private String calculationType;

    /** e.g. "final-dis-press / suct-press" */
    @Column(name = "expression", columnDefinition = "text")
    private String expression;

    /** Comma-separated list of source tag codes. */
    @Column(name = "source_tag_ids", columnDefinition = "text")
    private String sourceTagIds;

    @Column(name = "plot", nullable = false)
    private boolean plot = true;

    public Asset getAsset() {
        return asset;
    }

    public void setAsset(Asset asset) {
        this.asset = asset;
    }

    public String getTagName() {
        return tagName;
    }

    public void setTagName(String tagName) {
        this.tagName = tagName;
    }

    public String getCtagKey() {
        return ctagKey;
    }

    public void setCtagKey(String ctagKey) {
        this.ctagKey = ctagKey;
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

    public String getSamplingRate() {
        return samplingRate;
    }

    public void setSamplingRate(String samplingRate) {
        this.samplingRate = samplingRate;
    }

    public String getCalculationType() {
        return calculationType;
    }

    public void setCalculationType(String calculationType) {
        this.calculationType = calculationType;
    }

    public String getExpression() {
        return expression;
    }

    public void setExpression(String expression) {
        this.expression = expression;
    }

    public String getSourceTagIds() {
        return sourceTagIds;
    }

    public void setSourceTagIds(String sourceTagIds) {
        this.sourceTagIds = sourceTagIds;
    }

    public boolean isPlot() {
        return plot;
    }

    public void setPlot(boolean plot) {
        this.plot = plot;
    }
}
