-- V1_13__Add_Last_Login_At_To_Users.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
