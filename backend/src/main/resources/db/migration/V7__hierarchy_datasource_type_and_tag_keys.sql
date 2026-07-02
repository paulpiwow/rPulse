-- =============================================================================
-- rPulse Phase 6 - V7  (hierarchy: data source connector type + native tag keys)
--
-- V1-V6 are already applied and can't be edited, so these additions go in a new
-- file. Three new columns, all nullable so existing rows stay valid:
--
--   1. data_source.type  - machine-readable connector kind (HISTORIAN | PLC) that
--      the /datasources/{code}/available-tags endpoint switches on. Distinct from
--      the existing free-text source_type label. Backfilled from source_type where
--      it clearly names one of the two kinds.
--   2. tag.tag_key       - the native tag name as it lands in Influx (may differ
--      from tag_name and from the business code).
--   3. ctag.ctag_key     - the native ctag series key the computed value is written
--      under.
-- =============================================================================

-- 1. data_source.type — connector kind used for tag discovery.
ALTER TABLE data_source
    ADD COLUMN type VARCHAR(16)
        CHECK (type IS NULL OR type IN ('HISTORIAN', 'PLC'));

-- Backfill from the free-text label where it unambiguously names a kind.
UPDATE data_source SET type = 'HISTORIAN' WHERE lower(source_type) = 'historian';
UPDATE data_source SET type = 'PLC'       WHERE lower(source_type) = 'plc';

-- 2. tag.tag_key — native Influx series name.
ALTER TABLE tag  ADD COLUMN tag_key  VARCHAR(255);

-- 3. ctag.ctag_key — native Influx series name for the computed value.
ALTER TABLE ctag ADD COLUMN ctag_key VARCHAR(255);
