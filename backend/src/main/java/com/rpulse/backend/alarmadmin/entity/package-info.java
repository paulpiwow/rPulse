/**
 * JPA entities for the alarm + admin domain (OWNER: Ben) — mapped to the tables in
 * {@code V3__alarm_admin.sql}: app_user, notification_group, user_group, alarm_rule,
 * alarm_notify_group, alarm_notify_user, alarm_history, system_message, app_license.
 * Standard entities extend {@link com.rpulse.backend.common.BaseEntity}; the join
 * tables (user_group, alarm_notify_group, alarm_notify_user) have composite keys and
 * do not.
 */
package com.rpulse.backend.alarmadmin.entity;
