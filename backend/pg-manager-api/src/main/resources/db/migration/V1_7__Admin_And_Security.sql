-- Add owner_id and is_first_login columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS owner_id BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN NOT NULL DEFAULT TRUE;

-- Update existing users to have owner_id = id (for existing owners)
UPDATE users SET owner_id = id WHERE owner_id IS NULL;

-- Insert initial SUPER_ADMIN user
-- Password is 'admin1234' hashed with BCrypt (12 rounds)
INSERT INTO users (email, password_hash, full_name, role, active, owner_id, is_first_login)
SELECT 'admin@pgmanager.com', '$2a$12$R.S7WpXJ6O9pY6B3Vv6SBeK4I6N6B/f.yY3LqY.r6S6k9e6G6y2e2', 'System Administrator', 'SUPER_ADMIN', TRUE, 0, FALSE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE role = 'SUPER_ADMIN');

-- Update the owner_id of the super admin to its own ID once inserted
UPDATE users SET owner_id = id WHERE email = 'admin@pgmanager.com' AND role = 'SUPER_ADMIN';
