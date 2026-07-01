-- =============================================================================
-- rPulse Phase 6 - V5  (align column names with the design spec, 2026-07-01)
--
-- V1-V4 are already applied and can't be edited, so these renames go in a new
-- file. Pure column renames - no data change, no new columns. The Java field
-- names (and therefore the JSON keys the frontend reads) stay the same; only
-- the @Column(name=...) mappings move to these new column names.
--
--   app_user.phone                       -> phone_number
--   alarm_history.acknowledge_time       -> ack_time
--   alarm_history.acknowledged_by_user_id-> ack_by_user_id
--   alarm_history.cleared_by_user_id     -> clear_by_user_id
--   (alarm_history.clear_time already matches the spec.)
-- =============================================================================

ALTER TABLE app_user      RENAME COLUMN phone                   TO phone_number;

ALTER TABLE alarm_history RENAME COLUMN acknowledge_time        TO ack_time;
ALTER TABLE alarm_history RENAME COLUMN acknowledged_by_user_id TO ack_by_user_id;
ALTER TABLE alarm_history RENAME COLUMN cleared_by_user_id      TO clear_by_user_id;
