-- V1_14__Production_Performance_Indexes.sql
-- Optimizing multi-tenant queries for production scale

-- 1. Indexing owner_id on all multi-tenant tables
CREATE INDEX IF NOT EXISTS idx_rooms_owner ON rooms(owner_id);
CREATE INDEX IF NOT EXISTS idx_tenants_owner ON tenants(owner_id);
CREATE INDEX IF NOT EXISTS idx_payments_owner ON rent_payments(owner_id);
CREATE INDEX IF NOT EXISTS idx_tickets_owner ON maintenance_tickets(owner_id);
CREATE INDEX IF NOT EXISTS idx_expenses_owner ON general_expenses(owner_id);
CREATE INDEX IF NOT EXISTS idx_notifications_owner ON notifications(owner_id);
CREATE INDEX IF NOT EXISTS idx_hostel_settings_owner ON hostel_settings(owner_id);

-- 2. Performance indexes for common search/filter patterns
CREATE INDEX IF NOT EXISTS idx_tenants_email_owner ON tenants(owner_id, email);
CREATE INDEX IF NOT EXISTS idx_tenants_status_owner ON tenants(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_rooms_status_owner ON rooms(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_month_owner ON rent_payments(owner_id, rent_month);
CREATE INDEX IF NOT EXISTS idx_payments_status_owner ON rent_payments(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_status_owner ON maintenance_tickets(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_expenses_date_owner ON general_expenses(owner_id, expense_date);
