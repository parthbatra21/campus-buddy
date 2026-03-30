package com.campus_buddy.academic_service.service;

import com.campus_buddy.academic_service.dto.*;
import com.campus_buddy.academic_service.model.Attendance;
import com.campus_buddy.academic_service.model.AttendanceSession;
import com.campus_buddy.academic_service.repository.AttendanceRepository;
import com.campus_buddy.academic_service.repository.AttendanceSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * AttendanceService — all attendance business logic lives here.
 * Controller delegates to this service for session creation, attendance marking, and queries.
 */
@Service
public class AttendanceService {

    private static final Logger log = LoggerFactory.getLogger(AttendanceService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String SESSION_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoiding I, O, 1, 0

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private AttendanceSessionRepository sessionRepository;

    /**
     * Create an attendance session (Faculty only).
     * Generates a 6-digit session code and sets a 10-minute expiry.
     */
    public SessionResponse createSession(CreateSessionRequest request, String facultyEmail) {
        log.info("Creating attendance session for course={} by faculty={}", request.getCourseCode(), facultyEmail);

        AttendanceSession session = new AttendanceSession();
        session.setCourseCode(request.getCourseCode());
        session.setCreatedBy(facultyEmail);
        session.setExpiryTime(LocalDateTime.now().plusMinutes(10));
        session.setSessionCode(generateSessionCode());

        session.setLatitude(request.getLatitude());
        session.setLongitude(request.getLongitude());
        session.setAllowedRadius(request.getAllowedRadius() != null ? request.getAllowedRadius() : 100.0);

        AttendanceSession savedSession = sessionRepository.save(session);
        log.info("Session created: id={}, code={}, expiry={}", savedSession.getId(), savedSession.getSessionCode(), savedSession.getExpiryTime());

        return new SessionResponse(
            savedSession.getId(),
            savedSession.getSessionCode(),
            savedSession.getCourseCode(),
            savedSession.getExpiryTime(),
            savedSession.getCreatedBy()
        );
    }

    /**
     * Mark attendance for a student (Student only).
     *
     * Validation order:
     *  1. Resolve session by sessionCode or sessionId
     *  2. Verify session exists and is not expired
     *  3. Verify course code matches (if provided)
     *  4. Validate geolocation (if session has geofence)
     *  5. Check idempotency (one student, one attendance per session)
     *  6. Persist attendance record
     *
     * @throws IllegalArgumentException for invalid input / expired session
     * @throws IllegalStateException for duplicate attendance
     */
    @Transactional
    public AttendanceResponse markAttendance(MarkAttendanceRequest request, String studentEmail) {
        log.info("Student={} attempting to mark attendance: sessionCode={}, sessionId={}, course={}",
                studentEmail, request.getSessionCode(), request.getSessionId(), request.getCourseCode());

        // 1. Resolve session
        AttendanceSession session = resolveSession(request);

        // 2. Strict expiry re-check (defense against race between find and save)
        if (session.getExpiryTime().isBefore(LocalDateTime.now())) {
            log.warn("Student={} tried to mark attendance for expired session={}", studentEmail, session.getId());
            throw new IllegalArgumentException("Session has expired. Attendance cannot be marked after the session window closes.");
        }

        // 3. Verify course code
        if (request.getCourseCode() != null && !request.getCourseCode().isEmpty()) {
            if (!session.getCourseCode().equals(request.getCourseCode())) {
                log.warn("Course code mismatch: session={}, request={}", session.getCourseCode(), request.getCourseCode());
                throw new IllegalArgumentException("Course code does not match the session.");
            }
        }
        // Always use the session's course code as source of truth
        String courseCode = session.getCourseCode();

        // 4. Geolocation validation
        validateGeolocation(session, request, studentEmail);

        // 5. Idempotency check — one student per session
        if (attendanceRepository.existsByStudentEmailAndQrSessionId(studentEmail, session.getId())) {
            log.warn("Duplicate attendance attempt: student={}, session={}", studentEmail, session.getId());
            throw new IllegalStateException("Attendance already marked for this session.");
        }

        // 6. Persist
        Attendance attendance = new Attendance();
        attendance.setStudentEmail(studentEmail);
        attendance.setCourseCode(courseCode);
        attendance.setQrSessionId(session.getId());

        try {
            Attendance saved = attendanceRepository.save(attendance);
            log.info("Attendance marked successfully: student={}, session={}, course={}", studentEmail, session.getId(), courseCode);

            return mapToResponse(saved);
        } catch (DataIntegrityViolationException e) {
            // DB-level unique constraint caught (concurrent duplicate)
            log.warn("DB constraint violation for duplicate attendance: student={}, session={}", studentEmail, session.getId());
            throw new IllegalStateException("Attendance already marked for this session.");
        }
    }

    /**
     * Get all attendance records for a student, ordered newest first.
     */
    public List<AttendanceResponse> getStudentAttendance(String studentEmail) {
        return attendanceRepository.findByStudentEmailOrderByLectureDateDesc(studentEmail).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all attendance records for a specific course, ordered newest first. (Faculty only)
     */
    public List<AttendanceResponse> getCourseAttendance(String courseCode) {
        return attendanceRepository.findByCourseCodeOrderByLectureDateDesc(courseCode).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ─── Private helpers ───────────────────────────────────────────────

    private AttendanceSession resolveSession(MarkAttendanceRequest request) {
        LocalDateTime now = LocalDateTime.now();

        if (request.getSessionCode() != null && !request.getSessionCode().isBlank()) {
            return sessionRepository
                    .findBySessionCodeAndExpiryTimeAfter(request.getSessionCode().toUpperCase(), now)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid or expired session code."));
        }

        if (request.getSessionId() != null && !request.getSessionId().isBlank()) {
            return sessionRepository
                    .findByIdAndExpiryTimeAfter(request.getSessionId(), now)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid or expired session ID."));
        }

        throw new IllegalArgumentException("Either Session ID or Session Code must be provided.");
    }

    private void validateGeolocation(AttendanceSession session, MarkAttendanceRequest request, String studentEmail) {
        if (session.getLatitude() == null || session.getLongitude() == null) {
            return; // No geofence configured
        }

        if (request.getLatitude() == null || request.getLongitude() == null) {
            throw new IllegalArgumentException("Location permission is required to mark attendance for this session.");
        }

        double distance = calculateDistance(
            session.getLatitude(), session.getLongitude(),
            request.getLatitude(), request.getLongitude()
        );

        if (distance > session.getAllowedRadius()) {
            log.warn("Geofence violation: student={}, distance={}m, allowed={}m", studentEmail, distance, session.getAllowedRadius());
            throw new IllegalArgumentException(
                String.format("You are %.0fm away. Please be within %.0fm of the class.", distance, session.getAllowedRadius())
            );
        }
    }

    private AttendanceResponse mapToResponse(Attendance a) {
        return new AttendanceResponse(
            a.getId(),
            a.getStudentEmail(),
            a.getCourseCode(),
            a.getLectureDate(),
            a.getStatus(),
            a.getMarkedAt()
        );
    }

    /**
     * Generates a cryptographically secure 6-digit alphanumeric session code.
     */
    private String generateSessionCode() {
        StringBuilder code = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            code.append(SESSION_CODE_CHARS.charAt(SECURE_RANDOM.nextInt(SESSION_CODE_CHARS.length())));
        }
        return code.toString();
    }

    /**
     * Haversine formula — calculates distance between two GPS coordinates.
     * @return Distance in meters
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth's radius in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c * 1000; // convert to meters
    }
}
