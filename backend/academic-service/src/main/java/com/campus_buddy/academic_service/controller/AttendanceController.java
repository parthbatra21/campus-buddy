package com.campus_buddy.academic_service.controller;

import com.campus_buddy.academic_service.dto.*;
import com.campus_buddy.academic_service.model.Attendance;
import com.campus_buddy.academic_service.model.AttendanceSession;
import com.campus_buddy.academic_service.model.Role;
import com.campus_buddy.academic_service.repository.AttendanceRepository;
import com.campus_buddy.academic_service.repository.AttendanceSessionRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Attendance Controller - handles all attendance-related operations
 * Implements role-based access control for FACULTY and STUDENT actions
 */
@RestController
@RequestMapping("/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private AttendanceSessionRepository sessionRepository;

    /**
     * Phase 3: Create Attendance Session (FACULTY ONLY)
     * POST /attendance/session
     */
    @PostMapping("/session")
    public ResponseEntity<?> createSession(@Valid @RequestBody CreateSessionRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        // Verify FACULTY role
        boolean isFaculty = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_FACULTY"));
        
        if (!isFaculty) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Access denied. Only faculty can create attendance sessions.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }

        // Create session with 10-minute expiry
        AttendanceSession session = new AttendanceSession();
        session.setCourseCode(request.getCourseCode());
        session.setCreatedBy(auth.getName()); // Faculty email from JWT
        session.setExpiryTime(LocalDateTime.now().plusMinutes(10));
        session.setSessionCode(generateSessionCode()); // Generate 6-digit code
        
        // Geolocation Data
        session.setLatitude(request.getLatitude());
        session.setLongitude(request.getLongitude());
        session.setAllowedRadius(request.getAllowedRadius() != null ? request.getAllowedRadius() : 100.0); // Default 100m

        AttendanceSession savedSession = sessionRepository.save(session);

        // Build response
        SessionResponse response = new SessionResponse(
            savedSession.getId(),
            savedSession.getSessionCode(),
            savedSession.getCourseCode(),
            savedSession.getExpiryTime(),
            savedSession.getCreatedBy()
        );

        return ResponseEntity.ok(response);
    }

    private String generateSessionCode() {
        // Generate random 6-digit code (alphanumeric or numeric)
        // For simplicity, using uppercase alphanumeric
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoiding I, O, 1, 0 for clarity
        StringBuilder code = new StringBuilder();
        java.util.Random rnd = new java.util.Random();
        for (int i = 0; i < 6; i++) {
            code.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return code.toString();
    }

    /**
     * Phase 4: Mark Attendance (STUDENT ONLY)
     * POST /attendance/mark
     */
    @PostMapping("/mark")
    public ResponseEntity<?> markAttendance(@Valid @RequestBody MarkAttendanceRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        // Verify STUDENT role
        boolean isStudent = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_STUDENT"));
        
        if (!isStudent) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Access denied. Only students can mark attendance.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }

        AttendanceSession session = null;
        LocalDateTime now = LocalDateTime.now();

        // Try looking up by Code first, then ID
        if (request.getSessionCode() != null && !request.getSessionCode().isEmpty()) {
            session = sessionRepository.findBySessionCodeAndExpiryTimeAfter(request.getSessionCode().toUpperCase(), now).orElse(null);
        } else if (request.getSessionId() != null && !request.getSessionId().isEmpty()) {
            session = sessionRepository.findByIdAndExpiryTimeAfter(request.getSessionId(), now).orElse(null);
        } else {
             Map<String, String> error = new HashMap<>();
             error.put("error", "Either Session ID or Session Code must be provided.");
             return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        if (session == null) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Invalid or expired session.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        // Verify course code matches
        if (!session.getCourseCode().equals(request.getCourseCode())) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Course code does not match the session.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        // Geolocation Validation using Haversine Formula
        if (session.getLatitude() != null && session.getLongitude() != null) {
            if (request.getLatitude() == null || request.getLongitude() == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Location permission is required to mark attendance.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            double distance = calculateDistance(
                session.getLatitude(), session.getLongitude(),
                request.getLatitude(), request.getLongitude()
            );

            // Allow 10% buffer or strict radius
            if (distance > session.getAllowedRadius()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", String.format("You are %.0fm away. Please be within %.0fm of the class.", distance, session.getAllowedRadius()));
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }
        }

        String studentEmail = auth.getName(); // From JWT

        // Check for duplicate attendance (same student, course, date)
        List<Attendance> existing = attendanceRepository.findByStudentEmailOrderByLectureDateDesc(studentEmail);
        boolean alreadyMarked = existing.stream()
                .anyMatch(a -> a.getCourseCode().equals(request.getCourseCode()) 
                        && a.getLectureDate().equals(java.time.LocalDate.now()));

        if (alreadyMarked) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Attendance already marked for this course today.");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }

        // Save attendance record
        Attendance attendance = new Attendance();
        attendance.setStudentEmail(studentEmail);
        attendance.setCourseCode(request.getCourseCode());
        attendance.setQrSessionId(session.getId()); // Always store the ID reference
        
        Attendance saved = attendanceRepository.save(attendance);

        // Build response
        AttendanceResponse response = new AttendanceResponse(
            saved.getId(),
            saved.getStudentEmail(),
            saved.getCourseCode(),
            saved.getLectureDate(),
            saved.getStatus(),
            saved.getMarkedAt()
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Phase 5: Get Student's Own Attendance
     * GET /attendance/student
     */
    @GetMapping("/student")
    public ResponseEntity<?> getStudentAttendance() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String studentEmail = auth.getName();

        List<Attendance> attendanceList = attendanceRepository
                .findByStudentEmailOrderByLectureDateDesc(studentEmail);

        List<AttendanceResponse> response = attendanceList.stream()
                .map(a -> new AttendanceResponse(
                    a.getId(),
                    a.getStudentEmail(),
                    a.getCourseCode(),
                    a.getLectureDate(),
                    a.getStatus(),
                    a.getMarkedAt()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * Phase 5: Get Course Attendance (FACULTY ONLY)
     * GET /attendance/faculty/{courseCode}
     */
    @GetMapping("/faculty/{courseCode}")
    public ResponseEntity<?> getCourseAttendance(@PathVariable String courseCode) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        // Verify FACULTY role
        boolean isFaculty = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_FACULTY"));
        
        if (!isFaculty) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Access denied. Only faculty can view course attendance.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }

        List<Attendance> attendanceList = attendanceRepository
                .findByCourseCodeOrderByLectureDateDesc(courseCode);

        List<AttendanceResponse> response = attendanceList.stream()
                .map(a -> new AttendanceResponse(
                    a.getId(),
                    a.getStudentEmail(),
                    a.getCourseCode(),
                    a.getLectureDate(),
                    a.getStatus(),
                    a.getMarkedAt()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * Calculate distance between two points using Haversine formula
     * @return Distance in meters
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of the earth in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = R * c * 1000; // convert to meters
        return distance;
    }
}
