-- V1_12__Limit_Requests.sql

CREATE TABLE IF NOT EXISTS limit_requests (
    id                BIGSERIAL    PRIMARY KEY,
    owner_id          BIGINT       NOT NULL,
    request_type      VARCHAR(20)  NOT NULL, -- ROOMS, TENANTS
    current_limit     INT          NOT NULL,
    requested_limit   INT          NOT NULL,
    status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    admin_note        TEXT,
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_limit_request_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_limit_requests_owner ON limit_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_limit_requests_status ON limit_requests(status);
