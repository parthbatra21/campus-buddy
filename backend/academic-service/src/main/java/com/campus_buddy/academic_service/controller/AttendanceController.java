package com.campus_buddy.academic_service.controller;

import com.campus_buddy.academic_service.dto.*;
import com.campus_buddy.academic_service.model.Role;
import com.campus_buddy.academic_service.service.AttendanceService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Attendance Controller — thin controller that delegates to AttendanceService.
 * Handles role-based access control for FACULTY and STUDENT actions.
 */
@RestController
@RequestMapping("/attendance")
public class AttendanceController {

    private static final Logger log = LoggerFactory.getLogger(AttendanceController.class);

    @Autowired
    private AttendanceService attendanceService;

    /**
     * Create Attendance Session (FACULTY ONLY)
     * POST /attendance/session
     */
    @PostMapping("/session")
    public ResponseEntity<?> createSession(@Valid @RequestBody CreateSessionRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (!hasRole(auth, "ROLE_FACULTY")) {
            return errorResponse(HttpStatus.FORBIDDEN, "Access denied. Only faculty can create attendance sessions.");
        }

        try {
            SessionResponse response = attendanceService.createSession(request, auth.getName());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error creating session: {}", e.getMessage(), e);
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create session: " + e.getMessage());
        }
    }

    /**
     * Mark Attendance (STUDENT ONLY)
     * POST /attendance/mark
     */
    @PostMapping("/mark")
    public ResponseEntity<?> markAttendance(@Valid @RequestBody MarkAttendanceRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (!hasRole(auth, "ROLE_STUDENT")) {
            return errorResponse(HttpStatus.FORBIDDEN, "Access denied. Only students can mark attendance.");
        }

        try {
            AttendanceResponse response = attendanceService.markAttendance(request, auth.getName());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Attendance marking failed (bad input): {}", e.getMessage());
            return errorResponse(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (IllegalStateException e) {
            log.warn("Attendance marking failed (duplicate): {}", e.getMessage());
            return errorResponse(HttpStatus.CONFLICT, e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error marking attendance: {}", e.getMessage(), e);
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to mark attendance.");
        }
    }

    /**
     * Get Student's Own Attendance
     * GET /attendance/student
     */
    @GetMapping("/student")
    public ResponseEntity<?> getStudentAttendance() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String studentEmail = auth.getName();

        try {
            List<AttendanceResponse> response = attendanceService.getStudentAttendance(studentEmail);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching student attendance for {}: {}", studentEmail, e.getMessage());
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch attendance records.");
        }
    }

    /**
     * Get Course Attendance (FACULTY ONLY)
     * GET /attendance/faculty/{courseCode}
     */
    @GetMapping("/faculty/{courseCode}")
    public ResponseEntity<?> getCourseAttendance(@PathVariable String courseCode) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (!hasRole(auth, "ROLE_FACULTY")) {
            return errorResponse(HttpStatus.FORBIDDEN, "Access denied. Only faculty can view course attendance.");
        }

        try {
            List<AttendanceResponse> response = attendanceService.getCourseAttendance(courseCode);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching course attendance for {}: {}", courseCode, e.getMessage());
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch course attendance.");
        }
    }

    // ─── Helpers ───────────────────────────────────────────────

    private boolean hasRole(Authentication auth, String role) {
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(r -> r.equals(role));
    }

    private ResponseEntity<Map<String, String>> errorResponse(HttpStatus status, String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        return ResponseEntity.status(status).body(error);
    }
}
