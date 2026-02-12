package com.campus_buddy.auth_service.dto;

import com.campus_buddy.auth_service.model.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for authentication endpoints (register/login)
 * Contains JWT token and user information
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    
    private String token;
    private String tokenType = "Bearer";
    private Role role;
    private String email;
    
    public AuthResponse(String token, Role role, String email) {
        this.token = token;
        this.tokenType = "Bearer";
        this.role = role;
        this.email = email;
    }
}
