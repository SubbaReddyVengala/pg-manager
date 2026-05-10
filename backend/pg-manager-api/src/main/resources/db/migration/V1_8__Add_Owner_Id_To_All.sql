-- V1_8__Add_Owner_Id_To_All.sql
-- Adds owner_id column to all tables for multi-tenancy support in consolidated API

-- 1. hostel_settings
ALTER TABLE hostel_settings ADD COLUMN IF NOT EXISTS owner_id BIGINT;
UPDATE hostel_settings SET owner_id = (SELECT id FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1) WHERE owner_id IS NULL;

-- 2. rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS owner_id BIGINT;
-- Drop unique constraint on room_number as it should be unique per owner
ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_room_number_key;
ALTER TABLE rooms ADD CONSTRAINT uq_room_owner UNIQUE (owner_id, room_number);

-- 3. tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS owner_id BIGINT;
-- Drop unique constraint on email as it should be unique per owner
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_email_key;
ALTER TABLE tenants ADD CONSTRAINT uq_tenant_email_owner UNIQUE (owner_id, email);

-- 4. rent_payments
ALTER TABLE rent_payments ADD COLUMN IF NOT EXISTS owner_id BIGINT;

-- 5. maintenance_tickets
ALTER TABLE maintenance_tickets ADD COLUMN IF NOT EXISTS owner_id BIGINT;

-- 6. general_expenses
ALTER TABLE general_expenses ADD COLUMN IF NOT EXISTS owner_id BIGINT;

-- 7. notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS owner_id BIGINT;

-- 8. Fix SUPER_ADMIN password hash if it was broken
UPDATE users SET password_hash = '$2a$12$R.S7WpXJ6O9pY6B3Vv6SBeK4I6N6B/f.yY3LqY.r6S6k9e6G6y2e2' 
WHERE email = 'admin@pgmanager.com' AND role = 'SUPER_ADMIN';

-- Default owner_id to the first admin for existing data
DO $$
DECLARE
    admin_id BIGINT;
BEGIN
    SELECT id INTO admin_id FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1;
    IF admin_id IS NOT NULL THEN
        UPDATE rooms SET owner_id = admin_id WHERE owner_id IS NULL;
        UPDATE tenants SET owner_id = admin_id WHERE owner_id IS NULL;
        UPDATE rent_payments SET owner_id = admin_id WHERE owner_id IS NULL;
        UPDATE maintenance_tickets SET owner_id = admin_id WHERE owner_id IS NULL;
        UPDATE general_expenses SET owner_id = admin_id WHERE owner_id IS NULL;
        UPDATE notifications SET owner_id = admin_id WHERE owner_id IS NULL;
    END IF;
END $$;
