-- V1_18__Add_Phone_To_Users.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
