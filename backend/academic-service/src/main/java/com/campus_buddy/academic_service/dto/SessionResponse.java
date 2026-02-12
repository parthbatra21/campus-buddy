package com.campus_buddy.academic_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for session creation
 * Returns session details to faculty after successful creation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SessionResponse {

    private String sessionId;
    private String sessionCode;
    private String courseCode;
    private LocalDateTime expiryTime;
    private String createdBy;
}
