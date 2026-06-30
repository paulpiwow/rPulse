package com.rpulse.backend.alarmadmin.entity;

import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.rpulse.backend.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;

/**
 * A person who can use the app — their profile and settings.
 *
 * <p>Plain-English picture: this is the record behind the User Admin list (the table of
 * everyone with access) and the Edit User form. It holds who the person is, how to reach
 * them, what they're allowed to do (their role), and how they like to be notified.
 *
 * <p>Naming note: the table is called "app_user" rather than just "user" because "user"
 * is a reserved word in many databases — using it directly tends to cause errors, so we
 * sidestep the problem with a slightly different name.
 *
 * <p>The id, the unique code, and the created/updated timestamps all come from
 * {@link BaseEntity}, which every stored item in the app shares.
 */
@Entity                      // store rows of this class in a database table
@Table(name = "app_user")    // the table is called "app_user" (see naming note above)
public class AppUser extends BaseEntity {

    /** The person's full name as shown in the app. Required. */
    @Column(name = "user_name", nullable = false)
    private String userName;

    /**
     * The person's email address. Required, and marked unique — the database will refuse
     * to store two users with the same email, so each address identifies one person.
     */
    @Column(name = "email", nullable = false, unique = true)
    private String email;

    /** The person's phone number, used for SMS notifications. Optional. */
    @Column(name = "phone", length = 64)
    private String phone;

    /**
     * What the person is allowed to do in the app. One of: Viewer, Operator,
     * Maintenance / Reliability, Configurator, or System Administrator — roughly in order
     * from least to most access.
     */
    @Column(name = "role", nullable = false, length = 64)
    private String role;

    /** Whether this account is currently switched on. New users default to active (true). */
    @Column(name = "active", nullable = false)
    private boolean active = true;

    /** How the person wants to receive alerts: "Email", "SMS", or "Email, SMS" for both. */
    @Column(name = "notification_prefs", length = 64)
    private String notificationPrefs;

    /**
     * The notification groups this person belongs to.
     *
     * <p>"ManyToMany" because one person can be in several groups and one group contains
     * several people. The database stores these pairings in a separate connector table
     * called "user_group", where each row links one user id to one group id. The
     * "@JoinTable" block describes that table. Its own created_at timestamp is filled in
     * automatically by the database, so we don't manage it from here.
     *
     * <p>"@JsonIgnore" keeps this list out of the basic user data the app sends over the
     * web — otherwise every time we sent a user we'd also have to drag along all their
     * groups. The list of groups a user belongs to is fetched separately, through its own
     * dedicated request.
     */
    @JsonIgnore
    @ManyToMany
    @JoinTable(
        name = "user_group",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "group_id"))
    private Set<NotificationGroup> groups = new HashSet<>();

    // -----------------------------------------------------------------------
    // Getters and setters — the standard way the rest of the app reads each
    // field (get...) and writes a new value into it (set...).
    // -----------------------------------------------------------------------

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getNotificationPrefs() {
        return notificationPrefs;
    }

    public void setNotificationPrefs(String notificationPrefs) {
        this.notificationPrefs = notificationPrefs;
    }

    public Set<NotificationGroup> getGroups() {
        return groups;
    }

    public void setGroups(Set<NotificationGroup> groups) {
        this.groups = groups;
    }
}
