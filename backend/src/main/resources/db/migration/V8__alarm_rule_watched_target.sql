-- =============================================================================
-- rPulse Phase 6 - V8  (alarm_rule: unify the watched target)
--
-- V3 gave alarm_rule two separate nullable target FKs, tag_id and ctag_id, with a
-- "exactly one is set" convention enforced only in code. This collapses them into a
-- single target the engine can resolve uniformly:
--
--   watched_tag_id  BIGINT      - the id of the watched series (no FK: it may point at
--                                 either tag or ctag, decided by watched_kind)
--   watched_kind    VARCHAR(8)  - TAG (measured) | CTAG (computed)
--
-- Existing rows are migrated (tag_id -> TAG, ctag_id -> CTAG) before the old columns
-- are dropped. Dropping the columns also drops their FKs to tag/ctag.
-- =============================================================================

ALTER TABLE alarm_rule
    ADD COLUMN watched_tag_id BIGINT,
    ADD COLUMN watched_kind   VARCHAR(8)
        CHECK (watched_kind IS NULL OR watched_kind IN ('TAG', 'CTAG'));

-- Migrate existing targets. A row had at most one of tag_id / ctag_id set.
UPDATE alarm_rule SET watched_tag_id = tag_id,  watched_kind = 'TAG'  WHERE tag_id  IS NOT NULL;
UPDATE alarm_rule SET watched_tag_id = ctag_id, watched_kind = 'CTAG' WHERE ctag_id IS NOT NULL;

ALTER TABLE alarm_rule DROP COLUMN tag_id;
ALTER TABLE alarm_rule DROP COLUMN ctag_id;
