-- =============================================================================
-- rPulse Phase 6 - V4  (design feedback from Mark & John, 2026-07-01)
--
-- V1-V3 have already been applied, and an applied migration can never be edited
-- (the tool checks each file against a saved fingerprint), so every new change
-- goes in this fresh file instead.
--
-- Three changes, driven by the team's screen-by-screen review:
--   1. Acknowledging an alarm and clearing an alarm are two separate operator
--      actions, so we record who acknowledged it and, separately, when and by
--      whom it was cleared.
--   2. Messages need a "source" so the Message Center can sort and filter them.
--   3. Users track email and SMS notifications as separate on/off switches.
-- =============================================================================

-- 1. alarm_history: record who acknowledged, plus a separate "cleared" step.
--    (acknowledge_time and duration_seconds already exist from V3.)
ALTER TABLE alarm_history
    ADD COLUMN acknowledged_by_user_id BIGINT REFERENCES app_user (id) ON DELETE SET NULL,
    ADD COLUMN clear_time              TIMESTAMPTZ,
    ADD COLUMN cleared_by_user_id      BIGINT REFERENCES app_user (id) ON DELETE SET NULL;

-- 2. system_message: what kind of message this is, so the Message Center can
--    group and sort them. Defaults to SYSTEM so existing rows stay valid.
ALTER TABLE system_message
    ADD COLUMN source VARCHAR(32) NOT NULL DEFAULT 'SYSTEM'
        CHECK (source IN ('ALARM', 'MANUAL', 'SYSTEM', 'MAINTENANCE_WARNING', 'ALARM_STATUS'));

-- 3. app_user: separate on/off switches for email and SMS notifications.
ALTER TABLE app_user
    ADD COLUMN email_notifications BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN sms_notifications   BOOLEAN NOT NULL DEFAULT FALSE;
