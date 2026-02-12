package com.campus_buddy.academic_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response DTO for attendance records
 * Returns attendance information to students and faculty
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceResponse {

    private Long id;
    private String studentEmail;
    private String courseCode;
    private LocalDate lectureDate;
    private String status;
    private LocalDateTime markedAt;
}
