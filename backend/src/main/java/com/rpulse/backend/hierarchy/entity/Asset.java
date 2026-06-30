package com.rpulse.backend.hierarchy.entity;

import com.rpulse.backend.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * An asset within a {@link Site}, mapped to the {@code asset} table in
 * {@code V2__hierarchy.sql}. Only the domain columns are declared here; the
 * shared {@code id}, {@code code}, {@code created_at} and {@code updated_at}
 * come from {@link BaseEntity}.
 */
@Entity
@Table(name = "asset")
public class Asset extends BaseEntity {

    /** site_id BIGINT REFERENCES site(id) ON DELETE SET NULL — nullable. */
    @ManyToOne
    @JoinColumn(name = "site_id")
    private Site site;

    @Column(name = "asset_name", nullable = false)
    private String assetName;

    @Column(name = "location")
    private String location;

    @Column(name = "asset_type")
    private String assetType;

    @Column(name = "assigned_to")
    private String assignedTo;

    @Column(name = "baseline_required", nullable = false)
    private boolean baselineRequired = false;

    @Column(name = "enabled", nullable = false)
    private boolean enabled = true;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    public Site getSite() {
        return site;
    }

    public void setSite(Site site) {
        this.site = site;
    }

    public String getAssetName() {
        return assetName;
    }

    public void setAssetName(String assetName) {
        this.assetName = assetName;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getAssetType() {
        return assetType;
    }

    public void setAssetType(String assetType) {
        this.assetType = assetType;
    }

    public String getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(String assignedTo) {
        this.assignedTo = assignedTo;
    }

    public boolean isBaselineRequired() {
        return baselineRequired;
    }

    public void setBaselineRequired(boolean baselineRequired) {
        this.baselineRequired = baselineRequired;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
