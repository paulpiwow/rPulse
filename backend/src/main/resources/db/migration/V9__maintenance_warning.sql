-- =============================================================================
-- rPulse Phase 6 - V9 Maintenance Warning history
-- The log book of maintenance warnings, written by the MaintenanceWarningEngine.
-- Owned by Ben.
--
-- Plain-English picture: a "baseline" (in the baseline_rule table) says what a tag
-- normally looks like — its usual low, high, average, and how much it typically
-- wiggles (standard deviation). The maintenance-warning engine watches the live
-- reading for each enabled baseline, and every time a reading drifts outside that
-- normal range it writes one row here. So one baseline can produce many warning
-- rows over time, one per drift, exactly like alarm_history does for alarm rules.
--
-- This is deliberately SEPARATE from alarms: alarms come from rules a person sets
-- up; maintenance warnings come from a tag straying from its own baseline. Keeping
-- them in different tables keeps the two ideas from getting tangled.
-- =============================================================================
CREATE TABLE maintenance_warning_history (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code               VARCHAR(64)  NOT NULL UNIQUE,          -- MWH-<uuid>
    -- Which baseline this warning came from. Allowed to be empty: if the baseline
    -- is later deleted we keep the record but clear the link, so the history of
    -- "this warning happened" survives even when the setting behind it is gone.
    baseline_id        BIGINT       REFERENCES baseline_rule (id) ON DELETE SET NULL,
    -- The physical thing being watched (a pump, a tank...). Stored as an id number
    -- only, because assets live in a part of the app another teammate owns.
    asset_id           BIGINT       REFERENCES asset (id)         ON DELETE SET NULL,
    tag_code           VARCHAR(64)  NOT NULL,                 -- the tag/ctag series key that drifted
    scope              VARCHAR(16),                            -- Tag | CTag (Asset baselines have no series)
    observed_value     NUMERIC(18,4),                          -- the reading that broke the range
    -- A snapshot of the baseline's numbers at the moment this warning fired, copied
    -- in so the record still makes sense even if the baseline is edited later.
    baseline_low       NUMERIC(18,4),
    baseline_high      NUMERIC(18,4),
    baseline_target    NUMERIC(18,4),
    baseline_std_dev   NUMERIC(18,4),
    std_dev_multiplier NUMERIC(18,4),                          -- the N used in mean +/- N*std_dev
    direction          VARCHAR(16),                            -- ABOVE (too high) | BELOW (too low)
    basis              VARCHAR(16),                            -- RANGE | STDDEV | BOTH (which bound broke)
    owner              VARCHAR(255),                           -- responsible group name (from the baseline)
    trip_time          TIMESTAMPTZ,                            -- when the drift first started
    duration_seconds   INTEGER,                                -- how long the drift lasted
    status             VARCHAR(32),                            -- ACTIVE (still drifting) | CLEARED (back to normal)
    clear_time         TIMESTAMPTZ,                            -- when the reading returned to normal
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_mwh_baseline ON maintenance_warning_history (baseline_id);
CREATE INDEX idx_mwh_asset ON maintenance_warning_history (asset_id);
CREATE INDEX idx_mwh_trip_time ON maintenance_warning_history (trip_time);
CREATE INDEX idx_mwh_status ON maintenance_warning_history (status);
CREATE TRIGGER trg_mwh_updated_at BEFORE UPDATE ON maintenance_warning_history
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
