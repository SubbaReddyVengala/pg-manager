package com.pgmanager.payment.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntime(
            RuntimeException e, HttpServletRequest req) {
        return ResponseEntity.badRequest().body(
                new ErrorResponse(400, e.getMessage(), req.getRequestURI()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(
            Exception e, HttpServletRequest req) {
        e.printStackTrace();
        return ResponseEntity.status(500).body(
                new ErrorResponse(500, e.getMessage(), req.getRequestURI()));
    }
}
