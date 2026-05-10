-- V1_10__Owner_Profile_And_Account_Status.sql

-- 1. Add status column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

-- 2. Create owner_profiles table
CREATE TABLE IF NOT EXISTS owner_profiles (
    id                      BIGSERIAL    PRIMARY KEY,
    user_id                 BIGINT       NOT NULL UNIQUE,
    trial_end_date          TIMESTAMP,
    max_rooms               INT          NOT NULL DEFAULT 50,
    max_tenants             INT          NOT NULL DEFAULT 200,
    dashboard_enabled       BOOLEAN      NOT NULL DEFAULT TRUE,
    payments_enabled        BOOLEAN      NOT NULL DEFAULT TRUE,
    reports_enabled         BOOLEAN      NOT NULL DEFAULT TRUE,
    whatsapp_enabled        BOOLEAN      NOT NULL DEFAULT TRUE,
    maintenance_enabled     BOOLEAN      NOT NULL DEFAULT TRUE,
    expenses_enabled        BOOLEAN      NOT NULL DEFAULT TRUE,
    bulk_ops_enabled        BOOLEAN      NOT NULL DEFAULT FALSE,
    pdf_receipts_enabled    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_owner_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Provision profiles for existing owners
INSERT INTO owner_profiles (user_id)
SELECT id FROM users 
WHERE role = 'OWNER' 
AND id NOT IN (SELECT user_id FROM owner_profiles);
