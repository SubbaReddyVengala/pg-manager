CREATE TABLE auth_schema.account_events (
    id UUID PRIMARY KEY,
    user_id BIGINT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    description TEXT,
    performed_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth_schema.users(id)
);

CREATE INDEX idx_account_events_user_id ON auth_schema.account_events(user_id);
