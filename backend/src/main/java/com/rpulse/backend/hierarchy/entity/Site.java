package com.rpulse.backend.hierarchy.entity;

import com.rpulse.backend.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/**
 * Top of the asset hierarchy, mapped to the {@code site} table in
 * {@code V2__hierarchy.sql}. Only the domain columns are declared here; the
 * shared {@code id}, {@code code}, {@code created_at} and {@code updated_at}
 * come from {@link BaseEntity}.
 */
@Entity
@Table(name = "site")
public class Site extends BaseEntity {

    @Column(name = "site_name", nullable = false)
    private String siteName;

    @Column(name = "location")
    private String location;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    public String getSiteName() {
        return siteName;
    }

    public void setSiteName(String siteName) {
        this.siteName = siteName;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
