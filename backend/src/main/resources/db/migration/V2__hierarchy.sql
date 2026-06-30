-- =============================================================================
-- rPulse Phase 6 - V2 Hierarchy entities  (OWNER: Ty)
-- Tables: site, asset, machine, data_source, tag, ctag, baseline_rule
-- Fields derived from the Asset Configuration screen + prototype data.js
-- (RPULSE_DATA.assets / machines / dataSources / tagCatalog / ctags /
-- baselineRules). Runtime/Operate values (live status, latest_value, counts)
-- are intentionally excluded - those are computed from Influx at read time.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- site  - top of the hierarchy. Not present in the prototype data; fields
-- derived from the License Management screen (Site Name / Site Location /
-- Customer Name) and the application shell.
-- ---------------------------------------------------------------------------
CREATE TABLE site (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code          VARCHAR(64)  NOT NULL UNIQUE,
    site_name     VARCHAR(255) NOT NULL,
    location      VARCHAR(255),
    customer_name VARCHAR(255),
    description   TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_site_updated_at BEFORE UPDATE ON site
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- asset  - fields from the New Asset form (asset name/location/type/baseline
-- required/notes) + prototype assets (assigned_to, description).
-- ---------------------------------------------------------------------------
CREATE TABLE asset (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code              VARCHAR(64)  NOT NULL UNIQUE,
    site_id           BIGINT       REFERENCES site (id) ON DELETE SET NULL,
    asset_name        VARCHAR(255) NOT NULL,
    location          VARCHAR(255),
    asset_type        VARCHAR(64),
    assigned_to       VARCHAR(255),
    baseline_required BOOLEAN      NOT NULL DEFAULT FALSE,
    enabled           BOOLEAN      NOT NULL DEFAULT TRUE,
    description       TEXT,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_asset_site ON asset (site_id);
CREATE TRIGGER trg_asset_updated_at BEFORE UPDATE ON asset
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- machine  - prototype machines: machineName, type, location, description,
-- belongs to an asset.
-- ---------------------------------------------------------------------------
CREATE TABLE machine (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code         VARCHAR(64)  NOT NULL UNIQUE,
    asset_id     BIGINT       NOT NULL REFERENCES asset (id) ON DELETE CASCADE,
    machine_name VARCHAR(255) NOT NULL,
    machine_type VARCHAR(64),                 -- Package | PLC | Historian | VFD | Sensor
    location     VARCHAR(255),
    description  TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_machine_asset ON machine (asset_id);
CREATE TRIGGER trg_machine_updated_at BEFORE UPDATE ON machine
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- data_source  - prototype dataSources: sourceName, sourceType, protocol,
-- networkAddress, location; belongs to a machine.
-- ---------------------------------------------------------------------------
CREATE TABLE data_source (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code            VARCHAR(64)  NOT NULL UNIQUE,
    machine_id      BIGINT       NOT NULL REFERENCES machine (id) ON DELETE CASCADE,
    source_name     VARCHAR(255) NOT NULL,
    source_type     VARCHAR(64),               -- PLC | Historian | VFD | Sensor
    protocol        VARCHAR(64),               -- MODBUS TCP | OPC UA | MQTT | PROFINET
    network_address VARCHAR(255),
    location        VARCHAR(255),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_data_source_machine ON data_source (machine_id);
CREATE TRIGGER trg_data_source_updated_at BEFORE UPDATE ON data_source
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- tag  - measured tag. Prototype tagCatalog. The "code" column is the tag_id
-- (e.g. "suct-press") that keys the Influx series in rTruth. min/max/initial
-- are configuration; latest_value is runtime and intentionally omitted.
-- ---------------------------------------------------------------------------
CREATE TABLE tag (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code             VARCHAR(64)  NOT NULL UNIQUE,   -- tag_id / Influx series key
    data_source_id   BIGINT       NOT NULL REFERENCES data_source (id) ON DELETE CASCADE,
    tag_name         VARCHAR(255) NOT NULL,
    measurement_type VARCHAR(64),                    -- Pressure | Temperature | ...
    unit             VARCHAR(32),
    data_type        VARCHAR(32),                    -- float | integer
    sampling_rate    VARCHAR(32),                    -- "1 Hz", "300 Hz", "1 Minute"
    storage_mode     VARCHAR(32),                    -- raw | feature_window
    min_value        DOUBLE PRECISION,
    max_value        DOUBLE PRECISION,
    initial_value    DOUBLE PRECISION,
    plot             BOOLEAN      NOT NULL DEFAULT TRUE,
    color            VARCHAR(16),
    description      TEXT,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_tag_data_source ON tag (data_source_id);
CREATE TRIGGER trg_tag_updated_at BEFORE UPDATE ON tag
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- ctag  - computed tag. Prototype ctags: calculationType, expression,
-- sourceTagIds. Belongs to an asset (computed at the asset level).
-- ---------------------------------------------------------------------------
CREATE TABLE ctag (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code             VARCHAR(64)  NOT NULL UNIQUE,   -- ctag id
    asset_id         BIGINT       NOT NULL REFERENCES asset (id) ON DELETE CASCADE,
    tag_name         VARCHAR(255) NOT NULL,
    measurement_type VARCHAR(64),
    unit             VARCHAR(32),
    sampling_rate    VARCHAR(32),
    calculation_type VARCHAR(64),                    -- Algebraic | Standard Deviation | ...
    expression       TEXT,                           -- "final-dis-press / suct-press"
    source_tag_ids   TEXT,                           -- comma list of tag codes (see notes)
    plot             BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_ctag_asset ON ctag (asset_id);
CREATE TRIGGER trg_ctag_updated_at BEFORE UPDATE ON ctag
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- baseline_rule  - prototype baselineRules. A baseline applies at Asset, Tag,
-- or CTag scope; exactly one target FK is set per the scope (CHECK below).
-- ---------------------------------------------------------------------------
CREATE TABLE baseline_rule (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code              VARCHAR(64)  NOT NULL UNIQUE,
    scope             VARCHAR(16)  NOT NULL CHECK (scope IN ('Asset', 'Tag', 'CTag')),
    asset_id          BIGINT       NOT NULL REFERENCES asset (id) ON DELETE CASCADE,
    tag_id            BIGINT       REFERENCES tag (id)  ON DELETE CASCADE,
    ctag_id           BIGINT       REFERENCES ctag (id) ON DELETE CASCADE,
    measurement_type  VARCHAR(64),
    unit              VARCHAR(32),
    baseline_low      NUMERIC(18, 4),
    baseline_target   NUMERIC(18, 4),
    baseline_high     NUMERIC(18, 4),
    baseline_std_dev  NUMERIC(18, 4),
    evaluation_window VARCHAR(32),                    -- "15m", "5m"
    warning_delay     VARCHAR(32),                    -- "2 min"
    enabled           BOOLEAN      NOT NULL DEFAULT TRUE,
    owner             VARCHAR(255),                   -- responsible group name
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_baseline_scope_target CHECK (
        (scope = 'Asset' AND tag_id IS NULL AND ctag_id IS NULL) OR
        (scope = 'Tag'   AND tag_id IS NOT NULL AND ctag_id IS NULL) OR
        (scope = 'CTag'  AND ctag_id IS NOT NULL AND tag_id IS NULL)
    )
);
CREATE INDEX idx_baseline_asset ON baseline_rule (asset_id);
CREATE TRIGGER trg_baseline_updated_at BEFORE UPDATE ON baseline_rule
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
