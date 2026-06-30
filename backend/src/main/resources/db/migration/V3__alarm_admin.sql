-- =============================================================================
-- rPulse Phase 6 - V3 Alarm + Admin entities  (OWNER: Ben)
-- Tables: app_user, notification_group, user_group, alarm_rule, alarm_history,
--         system_message, app_license
--         (+ alarm_notify_group / alarm_notify_user join tables - see notes)
-- Fields derived from the Alarm Configuration, Group List / Group
-- Configuration, User Admin / Edit User, License Management / Renewal
-- Workflow, and Message Center screens, plus prototype data.js.
-- Depends on V2 (asset, tag, ctag, site).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- app_user  - "user" is reserved in SQL, so app_user (matches prototype).
-- Fields from User Admin grid + Edit User form (name/email/phone/role/active/
-- notification preferences).
-- ---------------------------------------------------------------------------
CREATE TABLE app_user (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code              VARCHAR(64)  NOT NULL UNIQUE,    -- USR-001
    user_name         VARCHAR(255) NOT NULL,
    email             VARCHAR(255) NOT NULL UNIQUE,
    phone             VARCHAR(64),
    role              VARCHAR(64)  NOT NULL
                       CHECK (role IN ('Viewer', 'Operator', 'Maintenance / Reliability',
                                       'Configurator', 'System Administrator')),
    active            BOOLEAN      NOT NULL DEFAULT TRUE,
    notification_prefs VARCHAR(64),                    -- "Email", "SMS", "Email, SMS"
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_app_user_updated_at BEFORE UPDATE ON app_user
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- notification_group  - "group" is reserved, so notification_group (matches
-- prototype). Fields from Group List grid + Group Configuration form. The
-- prototype "members" comma-string is normalized into user_group below.
-- ---------------------------------------------------------------------------
CREATE TABLE notification_group (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code        VARCHAR(64)  NOT NULL UNIQUE,          -- GRP-001
    group_name  VARCHAR(255) NOT NULL,
    purpose     TEXT,
    delivery    VARCHAR(64),                           -- "Email", "SMS", "Email, SMS"
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    notes       TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_notification_group_updated_at BEFORE UPDATE ON notification_group
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- user_group  - join table: which users belong to which notification groups
-- (the normalized form of Group Configuration "Members").
-- ---------------------------------------------------------------------------
CREATE TABLE user_group (
    user_id    BIGINT      NOT NULL REFERENCES app_user (id)          ON DELETE CASCADE,
    group_id   BIGINT      NOT NULL REFERENCES notification_group (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, group_id)
);
CREATE INDEX idx_user_group_group ON user_group (group_id);

-- ---------------------------------------------------------------------------
-- alarm_rule  - the Alarm Configuration screen. One alarm definition per row.
-- alarm_type drives which columns are used:
--   Threshold            -> operator, threshold_value, (tag_id | ctag_id)
--   Rate of Change       -> rate_value, rate_unit, rate_period, (tag_id | ctag_id)
--   Combinatorial Logic  -> logic_formula
-- Notify targets are normalized into alarm_notify_group / alarm_notify_user.
-- ---------------------------------------------------------------------------
CREATE TABLE alarm_rule (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code            VARCHAR(64)  NOT NULL UNIQUE,
    asset_id        BIGINT       NOT NULL REFERENCES asset (id) ON DELETE CASCADE,
    alarm_name      VARCHAR(255) NOT NULL,
    alarm_type      VARCHAR(32)  NOT NULL
                     CHECK (alarm_type IN ('Threshold', 'Rate of Change', 'Combinatorial Logic')),
    enabled         BOOLEAN      NOT NULL DEFAULT TRUE,
    severity        VARCHAR(16)  CHECK (severity IN ('red', 'yellow')),
    -- target tag/ctag (Threshold + Rate of Change). Combinatorial uses the formula.
    tag_id          BIGINT       REFERENCES tag (id)  ON DELETE CASCADE,
    ctag_id         BIGINT       REFERENCES ctag (id) ON DELETE CASCADE,
    -- Threshold
    operator        VARCHAR(8),                         -- > | < | =
    threshold_value NUMERIC(18, 4),
    -- Rate of Change
    rate_value      NUMERIC(18, 4),
    rate_unit       VARCHAR(32),
    rate_period     VARCHAR(16),                         -- second | minute | hour | day
    -- Combinatorial Logic
    logic_formula   TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_alarm_rule_asset ON alarm_rule (asset_id);
CREATE TRIGGER trg_alarm_rule_updated_at BEFORE UPDATE ON alarm_rule
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- alarm notify targets (Notify section of Alarm Configuration: Groups + Users).
CREATE TABLE alarm_notify_group (
    alarm_rule_id BIGINT NOT NULL REFERENCES alarm_rule (id)         ON DELETE CASCADE,
    group_id      BIGINT NOT NULL REFERENCES notification_group (id) ON DELETE CASCADE,
    PRIMARY KEY (alarm_rule_id, group_id)
);

CREATE TABLE alarm_notify_user (
    alarm_rule_id BIGINT NOT NULL REFERENCES alarm_rule (id) ON DELETE CASCADE,
    user_id       BIGINT NOT NULL REFERENCES app_user (id)   ON DELETE CASCADE,
    PRIMARY KEY (alarm_rule_id, user_id)
);

-- ---------------------------------------------------------------------------
-- alarm_history  - written by the alarm-evaluation engine (no CRUD owner).
-- Fields from prototype alarmHistory + Active Alarms. Links back to the rule
-- that fired (nullable so history survives rule deletion).
-- ---------------------------------------------------------------------------
CREATE TABLE alarm_history (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code              VARCHAR(64)  NOT NULL UNIQUE,      -- ALM-CAD-2401
    alarm_rule_id     BIGINT       REFERENCES alarm_rule (id) ON DELETE SET NULL,
    asset_id          BIGINT       REFERENCES asset (id)      ON DELETE SET NULL,
    alarm_name        VARCHAR(255) NOT NULL,
    severity          VARCHAR(16)  CHECK (severity IN ('red', 'yellow')),
    trip_time         TIMESTAMPTZ,
    notification_time TIMESTAMPTZ,
    acknowledge_time  TIMESTAMPTZ,
    duration_seconds  INTEGER,
    responsibility    VARCHAR(255),                       -- assigned group name
    status            VARCHAR(32),                        -- Open | Not Started | Resolved | Reviewed
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_alarm_history_rule ON alarm_history (alarm_rule_id);
CREATE INDEX idx_alarm_history_asset ON alarm_history (asset_id);
CREATE INDEX idx_alarm_history_trip_time ON alarm_history (trip_time);
CREATE TRIGGER trg_alarm_history_updated_at BEFORE UPDATE ON alarm_history
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- system_message  - Message Center. Prototype: title, target, createdAt,
-- status. target_group_id / target_user_id are optional resolved FKs; target
-- keeps the display string for cross-cutting targets (e.g. a role name).
-- ---------------------------------------------------------------------------
CREATE TABLE system_message (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code            VARCHAR(64)  NOT NULL UNIQUE,         -- MSG-001
    title           VARCHAR(255) NOT NULL,
    body            TEXT,
    target          VARCHAR(255),                         -- display target string
    target_group_id BIGINT       REFERENCES notification_group (id) ON DELETE SET NULL,
    target_user_id  BIGINT       REFERENCES app_user (id)           ON DELETE SET NULL,
    status          VARCHAR(32)  NOT NULL DEFAULT 'Unread'
                     CHECK (status IN ('Unread', 'Acknowledged')),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by BIGINT       REFERENCES app_user (id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_system_message_status ON system_message (status);
CREATE TRIGGER trg_system_message_updated_at BEFORE UPDATE ON system_message
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- app_license  - License Management + Renewal Workflow screens. One active
-- license per site. "license" is not reserved but app_license keeps naming
-- consistent with app_user.
-- ---------------------------------------------------------------------------
CREATE TABLE app_license (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code             VARCHAR(64)  NOT NULL UNIQUE,        -- LIC-0001
    site_id          BIGINT       REFERENCES site (id) ON DELETE SET NULL,
    customer_name    VARCHAR(255) NOT NULL,
    status           VARCHAR(32)  NOT NULL DEFAULT 'Active'
                      CHECK (status IN ('Active', 'Expired', 'Renewal Pending')),
    start_date       DATE,
    end_date         DATE,
    -- Renewal Workflow
    renewal_status   VARCHAR(32)
                      CHECK (renewal_status IN ('Not Started', 'Requested',
                                                'Pending Approval', 'Renewed')),
    customer_contact VARCHAR(255),
    requested_term   VARCHAR(32),                         -- "12 months" ...
    renewal_note     TEXT,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_app_license_site ON app_license (site_id);
CREATE TRIGGER trg_app_license_updated_at BEFORE UPDATE ON app_license
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
