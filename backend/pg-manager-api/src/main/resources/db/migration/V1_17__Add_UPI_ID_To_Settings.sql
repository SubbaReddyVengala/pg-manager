-- Add upi_id column to pg_settings table
ALTER TABLE pg_settings ADD COLUMN upi_id VARCHAR(255);
