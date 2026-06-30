package com.rpulse.backend.alarmadmin.entity;

import java.time.OffsetDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.rpulse.backend.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * A message shown in the app's Message Center — like an in-app inbox notice.
 *
 * <p>Plain-English picture: this is a note the system shows to people, with a title and
 * body. Each message is aimed at someone. The {@code target} field holds the plain text
 * shown for who it's for (for example a group name or a role). When that audience happens
 * to be a real group or a real person already in the system, we additionally store a
 * proper link to them ({@code targetGroup} / {@code targetUser}) so the app can connect
 * the message to the actual record, not just the displayed text.
 *
 * <p>The message also tracks whether it has been read and, if so, when and by whom.
 */
@Entity                          // store rows of this class in a database table
@Table(name = "system_message")  // the table is called "system_message"
public class SystemMessage extends BaseEntity {

    /** The headline of the message. Required. */
    @Column(name = "title", nullable = false)
    private String title;

    /** The main text of the message. */
    @Column(name = "body")
    private String body;

    /** The plain-text label for who the message is aimed at (e.g. a group name or a role). */
    @Column(name = "target")
    private String target;

    /**
     * The actual group this message is for, when the audience is a real group.
     *
     * <p>"ManyToOne" because many messages can point at the same group. "LAZY" means the
     * group's full details aren't loaded from the database until something asks for them.
     * The "target_group_id" column just holds that group's id number; it can be empty when
     * the message isn't aimed at a specific group.
     *
     * <p>"@JsonIgnore" keeps this linked group out of the message data the app sends over
     * the web — the plain-text {@code target} field above already covers what's displayed,
     * so we don't drag the whole group record along with every message.
     */
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_group_id")
    private NotificationGroup targetGroup;

    /** The actual person this message is for, when the audience is a single real user. Works like {@code targetGroup}, and is likewise kept out of the sent data. */
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_user_id")
    private AppUser targetUser;

    /**
     * Whether the message has been seen: "Unread" or "Acknowledged". Required, and starts
     * out as "Unread" for every new message.
     */
    @Column(name = "status", nullable = false, length = 32)
    private String status = "Unread";

    /** The moment the message was acknowledged (read and confirmed). Empty until that happens. */
    @Column(name = "acknowledged_at")
    private OffsetDateTime acknowledgedAt;

    /** The person who acknowledged the message. Empty until someone does. Links to an {@link AppUser}, and is kept out of the sent data like the other links. */
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "acknowledged_by")
    private AppUser acknowledgedBy;

    // -----------------------------------------------------------------------
    // Getters and setters — the standard way the rest of the app reads each
    // field (get...) and writes a new value into it (set...).
    // -----------------------------------------------------------------------

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public String getTarget() {
        return target;
    }

    public void setTarget(String target) {
        this.target = target;
    }

    public NotificationGroup getTargetGroup() {
        return targetGroup;
    }

    public void setTargetGroup(NotificationGroup targetGroup) {
        this.targetGroup = targetGroup;
    }

    public AppUser getTargetUser() {
        return targetUser;
    }

    public void setTargetUser(AppUser targetUser) {
        this.targetUser = targetUser;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public OffsetDateTime getAcknowledgedAt() {
        return acknowledgedAt;
    }

    public void setAcknowledgedAt(OffsetDateTime acknowledgedAt) {
        this.acknowledgedAt = acknowledgedAt;
    }

    public AppUser getAcknowledgedBy() {
        return acknowledgedBy;
    }

    public void setAcknowledgedBy(AppUser acknowledgedBy) {
        this.acknowledgedBy = acknowledgedBy;
    }
}
