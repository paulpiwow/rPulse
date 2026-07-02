package com.rpulse.backend.hierarchy.entity;

import com.rpulse.backend.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * A data source belonging to a {@link Machine}, mapped to the
 * {@code data_source} table in {@code V2__hierarchy.sql}. The shared
 * {@code id}, {@code code} and audit columns come from {@link BaseEntity}.
 */
@Entity
@Table(name = "data_source")
public class Datasource extends BaseEntity {

    /** machine_id BIGINT NOT NULL REFERENCES machine(id) ON DELETE CASCADE. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;

    @Column(name = "source_name", nullable = false)
    private String sourceName;

    /** PLC | Historian | VFD | Sensor (free-text label shown in the UI). */
    @Column(name = "source_type")
    private String sourceType;

    /**
     * The connector kind used to discover available tags (HISTORIAN | PLC). Distinct from the
     * free-text {@link #sourceType} label — this is the machine-readable routing key that the
     * {@code /datasources/{code}/available-tags} endpoint switches on.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 16)
    private DataSourceType type;

    /** MODBUS TCP | OPC UA | MQTT | PROFINET */
    @Column(name = "protocol")
    private String protocol;

    @Column(name = "network_address")
    private String networkAddress;

    @Column(name = "location")
    private String location;

    public Machine getMachine() {
        return machine;
    }

    public void setMachine(Machine machine) {
        this.machine = machine;
    }

    public String getSourceName() {
        return sourceName;
    }

    public void setSourceName(String sourceName) {
        this.sourceName = sourceName;
    }

    public String getSourceType() {
        return sourceType;
    }

    public void setSourceType(String sourceType) {
        this.sourceType = sourceType;
    }

    public DataSourceType getType() {
        return type;
    }

    public void setType(DataSourceType type) {
        this.type = type;
    }

    public String getProtocol() {
        return protocol;
    }

    public void setProtocol(String protocol) {
        this.protocol = protocol;
    }

    public String getNetworkAddress() {
        return networkAddress;
    }

    public void setNetworkAddress(String networkAddress) {
        this.networkAddress = networkAddress;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }
}
