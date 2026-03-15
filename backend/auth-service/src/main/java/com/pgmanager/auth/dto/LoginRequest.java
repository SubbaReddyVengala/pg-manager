
package com.pgmanager.auth.dto;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class LoginRequest {

    @Email(message = "Valid email is required")
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;
}
