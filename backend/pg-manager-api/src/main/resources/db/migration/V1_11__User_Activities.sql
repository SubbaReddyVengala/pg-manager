-- V1_11__User_Activities.sql

CREATE TABLE IF NOT EXISTS user_activities (
    id           BIGSERIAL    PRIMARY KEY,
    user_id      BIGINT       NOT NULL,
    owner_id     BIGINT,
    action_type  VARCHAR(50)  NOT NULL,
    description  TEXT,
    timestamp    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activities_user ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_owner ON user_activities(owner_id);
