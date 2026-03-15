
package com.pgmanager.auth.exception;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @AllArgsConstructor @NoArgsConstructor
public class ErrorResponse {
    private int status;
    private String message;
    private String path;
    private LocalDateTime timestamp;

    public ErrorResponse(int status, String message, String path) {
        this.status    = status;
        this.message   = message;
        this.path      = path;
        this.timestamp = LocalDateTime.now();
    }
}
