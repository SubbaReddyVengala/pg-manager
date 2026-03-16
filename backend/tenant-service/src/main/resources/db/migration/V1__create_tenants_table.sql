CREATE TABLE IF NOT EXISTS tenant_schema.tenants (
    id                BIGSERIAL     PRIMARY KEY,

    -- Personal Details (Screenshot 2 - PERSONAL DETAILS section)
    full_name         VARCHAR(100)  NOT NULL,
    phone             VARCHAR(15)   NOT NULL,
    email             VARCHAR(150)  NOT NULL UNIQUE,

    -- Room & Rent (Screenshot 2 - ROOM & RENT section)
    -- NULL for PENDING tenants who have no room yet
    room_id           BIGINT,
    room_number       VARCHAR(20),  -- denormalized for table display
    move_in_date      DATE,
    move_out_date     DATE,         -- set on move-out
    monthly_rent      NUMERIC(10,2),
    security_deposit  NUMERIC(10,2),
    rent_due_day      INTEGER,      -- e.g. 1 = "1st of every month"

    -- ID & Emergency (Screenshot 2 - ID & EMERGENCY section)
    id_proof_type     VARCHAR(30)   NOT NULL DEFAULT 'AADHAAR',
    id_number         VARCHAR(50),
    emergency_contact VARCHAR(100), -- name
    emergency_phone   VARCHAR(15),
    permanent_address TEXT,

    -- Status: PENDING (no room) | ACTIVE (has room) | INACTIVE (moved out)
    status            VARCHAR(20)   NOT NULL DEFAULT 'PENDING',

    created_at        TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_status     ON tenant_schema.tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_room_id    ON tenant_schema.tenants(room_id);
CREATE INDEX IF NOT EXISTS idx_tenants_phone      ON tenant_schema.tenants(phone);
CREATE INDEX IF NOT EXISTS idx_tenants_move_out   ON tenant_schema.tenants(move_out_date);
