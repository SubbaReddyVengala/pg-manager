package com.pgmanager.maintenance.client;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
public class RoomServiceClient {

    private final RestTemplate restTemplate;

    @Value("${room-service.url:http://127.0.0.1:8082}")
    private String roomServiceUrl;

    public boolean roomExists(String roomNumber) {
        try {
            // Assuming room-service has an endpoint /rooms/exists/{roomNumber}
            // If not, we might need to use /rooms/number/{roomNumber} and check for 404
            Boolean exists = restTemplate.getForObject(roomServiceUrl + "/rooms/exists/" + roomNumber, Boolean.class);
            return exists != null && exists;
        } catch (Exception e) {
            // Fallback: if service is down or endpoint missing, we might want to check /rooms
            // but for now, let's just log and return false to be safe
            System.err.println("Error checking room existence: " + e.getMessage());
            return false;
        }
    }
}

@Data
class RoomInfo {
    private Long id;
    private String roomNumber;
}
