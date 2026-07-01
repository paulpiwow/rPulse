-- =============================================================================
-- rPulse Phase 6 - V6  (align alarm_history.status with the firing lifecycle)
--
-- The alarm engine drives each fired alarm through a three-stage lifecycle:
--   ACTIVE  -> just tripped, firing, nobody has touched it
--   ACKED   -> an operator has seen it (still firing)
--   CLEARED -> resolved (reading returned to normal, or an operator force-cleared it)
--
-- V3 created alarm_history.status as a free-form VARCHAR(32) (its comment listed an
-- older review-workflow vocabulary: Open / Not Started / Resolved / Reviewed) with no
-- CHECK. This migration normalises any existing rows to the lifecycle above and adds a
-- CHECK so the column can only ever hold the three lifecycle states.
-- =============================================================================

-- Map the old review-workflow words onto the lifecycle, and coerce anything else
-- (including NULL) to ACTIVE so the new constraint can be added cleanly.
UPDATE alarm_history SET status = 'CLEARED' WHERE status IN ('Resolved', 'Reviewed');
UPDATE alarm_history SET status = 'ACTIVE'
    WHERE status IS NULL OR status NOT IN ('ACTIVE', 'ACKED', 'CLEARED');

ALTER TABLE alarm_history
    ADD CONSTRAINT chk_alarm_history_status CHECK (status IN ('ACTIVE', 'ACKED', 'CLEARED'));
