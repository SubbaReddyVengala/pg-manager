package com.pgmanager.api.maintenance.mapper;

import com.pgmanager.api.maintenance.dto.MaintenanceTicketResponse;
import com.pgmanager.api.maintenance.entity.MaintenanceTicket;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface MaintenanceMapper {
    MaintenanceTicketResponse toResponse(MaintenanceTicket ticket);
}
