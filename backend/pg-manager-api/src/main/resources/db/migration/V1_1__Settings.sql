-- Clean up any existing objects to prevent conflicts
DROP TABLE IF EXISTS hostel_settings CASCADE;

CREATE TABLE hostel_settings (
    id BIGSERIAL PRIMARY KEY,
    pg_name VARCHAR(255),
    owner_name VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    whatsapp_reminders BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    overdue_alerts BOOLEAN DEFAULT TRUE,
    maintenance_alerts BOOLEAN DEFAULT FALSE,
    monthly_report_email BOOLEAN DEFAULT FALSE,
    default_rent_due_day INT DEFAULT 1,
    late_fee_after_days INT DEFAULT 5,
    late_fee_amount DOUBLE PRECISION DEFAULT 50.0
);

-- Seed initial settings
INSERT INTO hostel_settings 
(pg_name, owner_name, phone, address, whatsapp_reminders, email_notifications, overdue_alerts, maintenance_alerts, monthly_report_email, default_rent_due_day, late_fee_after_days, late_fee_amount)
VALUES 
('Subbu''s PG Hostel', 'SubbaReddy Vengala', '9876543210', 'Hyderabad, Telangana - 500001', true, true, true, false, false, 1, 5, 50.0);
