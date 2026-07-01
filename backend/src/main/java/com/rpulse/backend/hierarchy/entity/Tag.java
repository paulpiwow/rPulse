package com.rpulse.backend.hierarchy.entity;

import com.rpulse.backend.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * A measured tag belonging to a {@link Datasource}, mapped to the {@code tag}
 * table in {@code V2__hierarchy.sql}. The inherited {@code code} is the tag_id
 * (e.g. "suct-press") that keys the Influx series in rTruth. {@code minValue} /
 * {@code maxValue} / {@code initialValue} are configuration; the live
 * latest value is runtime data and intentionally not persisted here.
 */
@Entity
@Table(name = "tag")
public class Tag extends BaseEntity {

    /** data_source_id BIGINT NOT NULL REFERENCES data_source(id) ON DELETE CASCADE. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "data_source_id", nullable = false)
    private Datasource datasource;

    @Column(name = "tag_name", nullable = false)
    private String tagName;

    /** Pressure | Temperature | ... */
    @Column(name = "measurement_type")
    private String measurementType;

    @Column(name = "unit")
    private String unit;

    /** float | integer */
    @Column(name = "data_type")
    private String dataType;

    /** "1 Hz", "300 Hz", "1 Minute" */
    @Column(name = "sampling_rate")
    private String samplingRate;

    /** raw | feature_window */
    @Column(name = "storage_mode")
    private String storageMode;

    @Column(name = "min_value")
    private Double minValue;

    @Column(name = "max_value")
    private Double maxValue;

    @Column(name = "initial_value")
    private Double initialValue;

    @Column(name = "plot", nullable = false)
    private boolean plot = true;

    @Column(name = "color")
    private String color;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    public Datasource getDatasource() {
        return datasource;
    }

    public void setDatasource(Datasource datasource) {
        this.datasource = datasource;
    }

    public String getTagName() {
        return tagName;
    }

    public void setTagName(String tagName) {
        this.tagName = tagName;
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

    public String getDataType() {
        return dataType;
    }

    public void setDataType(String dataType) {
        this.dataType = dataType;
    }

    public String getSamplingRate() {
        return samplingRate;
    }

    public void setSamplingRate(String samplingRate) {
        this.samplingRate = samplingRate;
    }

    public String getStorageMode() {
        return storageMode;
    }

    public void setStorageMode(String storageMode) {
        this.storageMode = storageMode;
    }

    public Double getMinValue() {
        return minValue;
    }

    public void setMinValue(Double minValue) {
        this.minValue = minValue;
    }

    public Double getMaxValue() {
        return maxValue;
    }

    public void setMaxValue(Double maxValue) {
        this.maxValue = maxValue;
    }

    public Double getInitialValue() {
        return initialValue;
    }

    public void setInitialValue(Double initialValue) {
        this.initialValue = initialValue;
    }

    public boolean isPlot() {
        return plot;
    }

    public void setPlot(boolean plot) {
        this.plot = plot;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
