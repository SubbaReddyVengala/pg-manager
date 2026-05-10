-- V1_9__Add_Temp_Password_To_Users.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS temp_password VARCHAR(255);
