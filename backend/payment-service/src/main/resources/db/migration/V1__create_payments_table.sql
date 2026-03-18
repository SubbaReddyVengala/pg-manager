-- V1__create_payments_table.sql
CREATE TABLE IF NOT EXISTS payment_schema.rent_payments (
    id               BIGSERIAL       PRIMARY KEY,

    -- Tenant info (snapshot — not FK, tenant may move out)
    tenant_id        BIGINT          NOT NULL,
    tenant_name      VARCHAR(150)    NOT NULL,
    room_id          BIGINT          NOT NULL,
    room_number      VARCHAR(20)     NOT NULL,

    -- Which month this payment is for (always 1st of month)
    rent_month       DATE            NOT NULL,

    -- Amounts
    rent_amount      NUMERIC(10,2)   NOT NULL,   -- monthly rent from tenant record
    amount_paid      NUMERIC(10,2)   NOT NULL DEFAULT 0,
    balance          NUMERIC(10,2)   NOT NULL DEFAULT 0,  -- rent_amount - amount_paid

    -- Payment details (filled when payment is recorded)
    payment_date     DATE,
    payment_mode     VARCHAR(20),    -- CASH, UPI, BANK_TRANSFER, CHEQUE
    transaction_id   VARCHAR(100),   -- UPI ref / cheque no / bank txn id
    note             TEXT,

    -- Status: PENDING → PARTIAL or PAID (or OVERDUE if past due date)
    status           VARCHAR(20)     NOT NULL DEFAULT 'PENDING',

    -- Receipt
    receipt_number   VARCHAR(50),    -- RCP-2026-0001 format

    -- Timestamps
    created_at       TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP       NOT NULL DEFAULT NOW(),

    -- Idempotency: one record per tenant per month
    CONSTRAINT uq_tenant_month UNIQUE (tenant_id, rent_month)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_payments_month  ON payment_schema.rent_payments(rent_month);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payment_schema.rent_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_schema.rent_payments(status);

-- Sequence for receipt numbers
CREATE SEQUENCE IF NOT EXISTS payment_schema.receipt_seq START 1 INCREMENT 1;
