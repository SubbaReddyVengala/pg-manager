CREATE TABLE auth_schema.pg_settings (
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
INSERT INTO auth_schema.pg_settings 
(pg_name, owner_name, phone, address)
VALUES 
('Subbu''s PG Hostel', 'SubbaReddy Vengala', '9876543210', 'Hyderabad, Telangana - 500001');
