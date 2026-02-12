package com.campus_buddy.academic_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating an attendance session
 * Used by faculty to generate a new attendance session
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateSessionRequest {

    @NotBlank(message = "Course code is required")
    private String courseCode;

    private Double latitude;
    private Double longitude;
    private Double allowedRadius;
}
