
-- Flyway migration V1: creates the users table in auth_schema

CREATE TABLE IF NOT EXISTS auth_schema.users (
    id             BIGSERIAL    PRIMARY KEY,
    email          VARCHAR(150) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    full_name      VARCHAR(100) NOT NULL,
    role           VARCHAR(20)  NOT NULL DEFAULT 'OWNER',
    refresh_token  TEXT,
    active         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email
    ON auth_schema.users(email);
