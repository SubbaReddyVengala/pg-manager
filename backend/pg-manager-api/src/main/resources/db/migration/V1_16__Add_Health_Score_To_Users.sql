-- Add health_score column to users table
ALTER TABLE users ADD COLUMN health_score INTEGER DEFAULT 0;
