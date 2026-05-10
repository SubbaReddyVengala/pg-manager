ALTER TABLE auth_schema.users ADD COLUMN tenant_id UUID;
-- For existing owners, we can't easily generate a stable UUID in SQL without extensions, 
-- but we can use gen_random_uuid() if available or just leave it for now and handle in code.
UPDATE auth_schema.users SET tenant_id = gen_random_uuid() WHERE tenant_id IS NULL;
ALTER TABLE auth_schema.users ALTER COLUMN tenant_id SET NOT NULL;
