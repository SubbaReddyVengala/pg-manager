CREATE TABLE auth_schema.staff_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id BIGINT NOT NULL,
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(15),
    permissions JSONB NOT NULL DEFAULT '{"canRecordPayment":true,"canRaiseMaintenance":true,"canViewRooms":true,"canViewTenants":true}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_owner FOREIGN KEY (owner_id) REFERENCES auth_schema.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_staff_owner ON auth_schema.staff_users(owner_id);
CREATE INDEX idx_staff_email ON auth_schema.staff_users(email);
