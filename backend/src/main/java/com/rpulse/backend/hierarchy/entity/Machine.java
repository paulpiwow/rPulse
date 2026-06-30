package com.rpulse.backend.hierarchy.entity;

import com.rpulse.backend.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * A machine belonging to an {@link Asset}, mapped to the {@code machine} table
 * in {@code V2__hierarchy.sql}. The shared {@code id}, {@code code} and audit
 * columns come from {@link BaseEntity}.
 */
@Entity
@Table(name = "machine")
public class Machine extends BaseEntity {

    /** asset_id BIGINT NOT NULL REFERENCES asset(id) ON DELETE CASCADE. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "asset_id", nullable = false)
    private Asset asset;

    @Column(name = "machine_name", nullable = false)
    private String machineName;

    /** Package | PLC | Historian | VFD | Sensor */
    @Column(name = "machine_type")
    private String machineType;

    @Column(name = "location")
    private String location;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    public Asset getAsset() {
        return asset;
    }

    public void setAsset(Asset asset) {
        this.asset = asset;
    }

    public String getMachineName() {
        return machineName;
    }

    public void setMachineName(String machineName) {
        this.machineName = machineName;
    }

    public String getMachineType() {
        return machineType;
    }

    public void setMachineType(String machineType) {
        this.machineType = machineType;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
