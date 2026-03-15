-- V1__create_rooms_table.sql

CREATE TABLE IF NOT EXISTS room_schema.rooms (
    id            BIGSERIAL     PRIMARY KEY,
    room_number   VARCHAR(20)   NOT NULL UNIQUE,
    floor         INTEGER       NOT NULL DEFAULT 1,
    room_type     VARCHAR(20)   NOT NULL,            -- SINGLE, DOUBLE, TRIPLE
    max_capacity  INTEGER       NOT NULL DEFAULT 1,
    occupancy     INTEGER       NOT NULL DEFAULT 0,  -- current tenants count
    rent_amount   NUMERIC(10,2) NOT NULL,
    amenities     TEXT,                              -- e.g. AC, WiFi, Geyser
    status        VARCHAR(20)   NOT NULL DEFAULT 'AVAILABLE',
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_status ON room_schema.rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_number ON room_schema.rooms(room_number);
