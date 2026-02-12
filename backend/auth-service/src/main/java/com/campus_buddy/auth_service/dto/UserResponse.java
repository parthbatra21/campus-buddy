package com.campus_buddy.auth_service.dto;

import com.campus_buddy.auth_service.model.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for user information (excludes sensitive data like password)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    
    private Long id;
    private String studentId;
    private String email;
    private String username;
    private Role role;
    private LocalDateTime createdAt;
}
