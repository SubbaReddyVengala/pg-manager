package com.pgmanager.room.enums;

public enum RoomStatus {
    AVAILABLE,    // room is empty and ready for tenant
    OCCUPIED,     // room has active tenant(s)
    MAINTENANCE   // room under maintenance, not available
}
