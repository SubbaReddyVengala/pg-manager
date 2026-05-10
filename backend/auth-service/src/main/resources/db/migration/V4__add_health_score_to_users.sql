ALTER TABLE auth_schema.users ADD COLUMN health_score INT DEFAULT 0;
ALTER TABLE auth_schema.users ADD COLUMN last_login_at TIMESTAMP;
