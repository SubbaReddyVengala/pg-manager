-- V1_15__Audit_Logging.sql
CREATE TABLE IF NOT EXISTS audit_logs (
    id           BIGSERIAL    PRIMARY KEY,
    owner_id     BIGINT       NOT NULL,
    user_id      BIGINT       NOT NULL,
    action_type  VARCHAR(20)  NOT NULL, -- CREATE, UPDATE, DELETE
    entity_name  VARCHAR(50)  NOT NULL, -- Room, Tenant, Payment
    entity_id    BIGINT,
    details      TEXT,                -- JSON or string representation of change
    ip_address   VARCHAR(45),
    timestamp    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_owner ON audit_logs(owner_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_name, entity_id);
