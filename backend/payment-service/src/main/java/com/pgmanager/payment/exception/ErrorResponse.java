package com.pgmanager.payment.exception;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

@Data @AllArgsConstructor
public class ErrorResponse {
    private int    status;
    private String message;
    private String path;
    private LocalDateTime timestamp = LocalDateTime.now();
    public ErrorResponse(int status, String message, String path) {
        this.status = status; this.message = message; this.path = path;
    }
}

