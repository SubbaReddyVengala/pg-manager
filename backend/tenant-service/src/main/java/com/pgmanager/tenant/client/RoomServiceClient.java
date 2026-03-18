package com.pgmanager.tenant.client;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
public class RoomServiceClient {

    private final RestTemplate restTemplate;

    @Value("${room-service.url}")
    private String roomServiceUrl;

    // Called when assigning room to tenant
    // Sets room status to OCCUPIED
    public void markOccupied(Long roomId) {
        String url = roomServiceUrl + "/rooms/" + roomId + "/status?status=OCCUPIED";
        restTemplate.patchForObject(url, null, Void.class);
    }

    // Called when tenant moves out
    // Sets room status back to AVAILABLE
    public void markAvailable(Long roomId) {
        String url = roomServiceUrl + "/rooms/" + roomId + "/status?status=AVAILABLE";
        restTemplate.patchForObject(url, null, Void.class);
    }

    // Gets room number by id -- used when assigning room
    public String getRoomNumber(Long roomId) {
        try {
            String url = roomServiceUrl + "/rooms/" + roomId;
            RoomInfo info = restTemplate.getForObject(url, RoomInfo.class);
            return info != null ? info.getRoomNumber() : null;
        } catch (Exception e) {
            return null;
        }
    }

    // Inner class -- only needs roomNumber from room-service response
    @lombok.Data
    public static class RoomInfo {
        private Long   id;
        private String roomNumber;
        private Integer floor;
        private String status;
    }
    public void incrementOccupancy(Long roomId) {
        String url = roomServiceUrl + "/rooms/" + roomId + "/occupancy/increment";
        restTemplate.patchForObject(url, null, String.class);
    }

    public void decrementOccupancy(Long roomId) {
        String url = roomServiceUrl + "/rooms/" + roomId + "/occupancy/decrement";
        restTemplate.patchForObject(url, null, String.class);
    }
}
