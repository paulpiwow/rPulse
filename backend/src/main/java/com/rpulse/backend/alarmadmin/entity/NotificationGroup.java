package com.rpulse.backend.alarmadmin.entity;

import com.rpulse.backend.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/**
 * A named group of people who get notified together — like a mailing list.
 *
 * <p>Plain-English picture: instead of attaching alarms to people one by one, you can
 * make a group such as "Night Shift Operators" and notify the whole group at once. This
 * is the record behind the Group List screen and the Group Configuration form.
 *
 * <p>Notice this class only describes the group itself (its name, purpose, and so on).
 * Who is actually in the group is kept separately, in the "user_group" connector table,
 * which is managed from the {@link AppUser} side (see {@link AppUser#getGroups()}). Keeping
 * the membership list in its own table is what lets one person belong to many groups and
 * one group hold many people.
 *
 * <p>Naming note: the table is called "notification_group" rather than "group" because
 * "group" is a reserved word in the database and would cause errors if used directly.
 */
@Entity                              // store rows of this class in a database table
@Table(name = "notification_group")  // the table is called "notification_group" (see naming note)
public class NotificationGroup extends BaseEntity {

    /** The group's name as shown in the app, e.g. "Night Shift Operators". Required. */
    @Column(name = "group_name", nullable = false)
    private String groupName;

    /** A short description of what this group is for. */
    @Column(name = "purpose")
    private String purpose;

    /** How members of this group are contacted: "Email", "SMS", or "Email, SMS" for both. */
    @Column(name = "delivery", length = 64)
    private String delivery;

    /** Whether this group is currently switched on. New groups default to active (true). */
    @Column(name = "active", nullable = false)
    private boolean active = true;

    /** Free-text notes about the group, for anything that doesn't fit the other fields. */
    @Column(name = "notes")
    private String notes;

    // -----------------------------------------------------------------------
    // Getters and setters — the standard way the rest of the app reads each
    // field (get...) and writes a new value into it (set...).
    // -----------------------------------------------------------------------

    public String getGroupName() {
        return groupName;
    }

    public void setGroupName(String groupName) {
        this.groupName = groupName;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getDelivery() {
        return delivery;
    }

    public void setDelivery(String delivery) {
        this.delivery = delivery;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
