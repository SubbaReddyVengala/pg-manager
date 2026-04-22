package com.pgmanager.maintenance.mapper;

import com.pgmanager.maintenance.dto.MaintenanceTicketResponse;
import com.pgmanager.maintenance.entity.MaintenanceTicket;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface MaintenanceMapper {
    MaintenanceTicketResponse toResponse(MaintenanceTicket ticket);
}
