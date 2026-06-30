-- =============================================================================
-- rPulse Phase 6 - V1 Foundation
-- Shared database objects used by every domain migration (V2 hierarchy, V3
-- alarm/admin). Owned by the scaffolding pair (Ben + Ty).
--
-- Conventions used across all rPulse migrations:
--   * snake_case table + column names.
--   * Surrogate PK:  id BIGINT GENERATED ALWAYS AS IDENTITY.
--   * Natural business key from the prototype (e.g. "GRP-001") kept as a
--     UNIQUE "code" column so the UI/import paths stay stable.
--   * Audit columns created_at / updated_at on every table, maintained by the
--     set_updated_at() trigger below.
--   * Enumerations enforced with CHECK constraints (no native ENUM types, so
--     values stay editable without ALTER TYPE migrations).
-- =============================================================================

-- Reusable trigger to keep updated_at current on any row UPDATE.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
