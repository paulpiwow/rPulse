package com.rpulse.backend.alarmadmin.entity;

import java.time.LocalDate;

import com.rpulse.backend.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/**
 * A customer's software license, with the details needed to track it and renew it.
 *
 * <p>Plain-English picture: every customer site runs rPulse under a license that has a
 * start and end date, much like a subscription. This is the record behind the License
 * Management screen (which shows who has a license and whether it's still valid) and the
 * Renewal Workflow screen (which tracks the steps of getting a license renewed before it
 * lapses).
 *
 * <p>Each site has one active license. The site itself lives in the hierarchy part of
 * the app (Ty's area), so here we just store the site's id number rather than link to it.
 */
@Entity                          // store rows of this class in a database table
@Table(name = "app_license")     // the table is called "app_license"
public class AppLicense extends BaseEntity {

    /** The id number of the site this license belongs to. Optional. */
    @Column(name = "site_id")
    private Long siteId;

    /** The name of the customer who holds the license. Required. */
    @Column(name = "customer_name", nullable = false)
    private String customerName;

    /**
     * The overall state of the license. Must be one of: Active, Expired, or Renewal
     * Pending. New licenses start out as "Active" (that's what the {@code = "Active"} does).
     */
    @Column(name = "status", nullable = false, length = 32)
    private String status = "Active";

    /** The date the license period begins. */
    @Column(name = "start_date")
    private LocalDate startDate;

    /** The date the license period ends (when it would expire if not renewed). */
    @Column(name = "end_date")
    private LocalDate endDate;

    /**
     * Where the renewal effort currently stands: Not Started, Requested, Pending
     * Approval, or Renewed. Optional — it's only meaningful once a renewal is underway.
     */
    @Column(name = "renewal_status", length = 32)
    private String renewalStatus;

    /** A name or details for the person to contact at the customer about this license. */
    @Column(name = "customer_contact")
    private String customerContact;

    /** The length of renewal that was requested, e.g. "12 months", "24 months", "36 months". */
    @Column(name = "requested_term", length = 32)
    private String requestedTerm;

    /** A free-text note for any extra detail about the renewal. */
    @Column(name = "renewal_note")
    private String renewalNote;

    // -----------------------------------------------------------------------
    // Getters and setters — the standard way the rest of the app reads each
    // field (get...) and writes a new value into it (set...).
    // -----------------------------------------------------------------------

    public Long getSiteId() {
        return siteId;
    }

    public void setSiteId(Long siteId) {
        this.siteId = siteId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getRenewalStatus() {
        return renewalStatus;
    }

    public void setRenewalStatus(String renewalStatus) {
        this.renewalStatus = renewalStatus;
    }

    public String getCustomerContact() {
        return customerContact;
    }

    public void setCustomerContact(String customerContact) {
        this.customerContact = customerContact;
    }

    public String getRequestedTerm() {
        return requestedTerm;
    }

    public void setRequestedTerm(String requestedTerm) {
        this.requestedTerm = requestedTerm;
    }

    public String getRenewalNote() {
        return renewalNote;
    }

    public void setRenewalNote(String renewalNote) {
        this.renewalNote = renewalNote;
    }
}
