CREATE TABLE maintenance_tickets (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT,
    room_number VARCHAR(50),
    tenant_id BIGINT,
    tenant_name VARCHAR(255),
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    cost DECIMAL(19, 2) DEFAULT 0,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE TABLE general_expenses (
    id BIGSERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    amount DECIMAL(19, 2) NOT NULL,
    expense_date DATE NOT NULL,
    note TEXT
);

-- Index for performance
CREATE INDEX idx_tickets_status ON maintenance_tickets(status);
CREATE INDEX idx_expenses_date ON general_expenses(expense_date);
