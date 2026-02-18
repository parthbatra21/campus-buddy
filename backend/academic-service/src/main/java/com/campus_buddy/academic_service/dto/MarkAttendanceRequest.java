package com.campus_buddy.academic_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for marking attendance
 * Used by students to mark their attendance using a session ID
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MarkAttendanceRequest {

    private String sessionId; // Optional if sessionCode is provided
    private String sessionCode; // Optional if sessionId is provided

    private String courseCode;

    private Double latitude;
    private Double longitude;
}
