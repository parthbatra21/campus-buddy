package com.campus_buddy.academic_service.service;

import com.campus_buddy.academic_service.dto.*;
import com.campus_buddy.academic_service.model.Attendance;
import com.campus_buddy.academic_service.model.AttendanceSession;
import com.campus_buddy.academic_service.repository.AttendanceRepository;
import com.campus_buddy.academic_service.repository.AttendanceSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private AttendanceSessionRepository sessionRepository;

    public SessionResponse createSession(CreateSessionRequest request, String facultyEmail) {
        AttendanceSession session = new AttendanceSession();
        session.setCourseCode(request.getCourseCode());
        session.setCreatedBy(facultyEmail);
        session.setExpiryTime(LocalDateTime.now().plusMinutes(10));
        session.setSessionCode(generateSessionCode());
        
        session.setLatitude(request.getLatitude());
        session.setLongitude(request.getLongitude());
        session.setAllowedRadius(request.getAllowedRadius() != null ? request.getAllowedRadius() : 100.0);

        AttendanceSession savedSession = sessionRepository.save(session);

        return new SessionResponse(
            savedSession.getId(),
            savedSession.getSessionCode(),
            savedSession.getCourseCode(),
            savedSession.getExpiryTime(),
            savedSession.getCreatedBy()
        );
    }

    public AttendanceResponse markAttendance(MarkAttendanceRequest request, String studentEmail) {
        AttendanceSession session = null;
        LocalDateTime now = LocalDateTime.now();

        if (request.getSessionCode() != null && !request.getSessionCode().isEmpty()) {
            session = sessionRepository.findBySessionCodeAndExpiryTimeAfter(request.getSessionCode().toUpperCase(), now).orElse(null);
        } else if (request.getSessionId() != null && !request.getSessionId().isEmpty()) {
            session = sessionRepository.findByIdAndExpiryTimeAfter(request.getSessionId(), now).orElse(null);
        }

        if (session == null) {
            throw new IllegalArgumentException("Invalid or expired session.");
        }

        if (!session.getCourseCode().equals(request.getCourseCode())) {
            throw new IllegalArgumentException("Course code does not match the session.");
        }

        if (session.getLatitude() != null && session.getLongitude() != null) {
            if (request.getLatitude() == null || request.getLongitude() == null) {
                throw new IllegalArgumentException("Location permission is required to mark attendance.");
            }

            double distance = calculateDistance(
                session.getLatitude(), session.getLongitude(),
                request.getLatitude(), request.getLongitude()
            );

            if (distance > session.getAllowedRadius()) {
                throw new IllegalArgumentException(String.format("You are %.0fm away. Please be within %.0fm of the class.", distance, session.getAllowedRadius()));
            }
        }

        List<Attendance> existing = attendanceRepository.findByStudentEmailOrderByLectureDateDesc(studentEmail);
        boolean alreadyMarked = existing.stream()
                .anyMatch(a -> a.getCourseCode().equals(request.getCourseCode()) 
                        && a.getLectureDate().equals(java.time.LocalDate.now()));

        if (alreadyMarked) {
             throw new IllegalStateException("Attendance already marked for this course today.");
        }

        Attendance attendance = new Attendance();
        attendance.setStudentEmail(studentEmail);
        attendance.setCourseCode(request.getCourseCode());
        attendance.setQrSessionId(session.getId());
        
        Attendance saved = attendanceRepository.save(attendance);

        return new AttendanceResponse(
            saved.getId(),
            saved.getStudentEmail(),
            saved.getCourseCode(),
            saved.getLectureDate(),
            saved.getStatus(),
            saved.getMarkedAt()
        );
    }

    public List<AttendanceResponse> getStudentAttendance(String studentEmail) {
        return attendanceRepository.findByStudentEmailOrderByLectureDateDesc(studentEmail).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<AttendanceResponse> getCourseAttendance(String courseCode) {
        return attendanceRepository.findByCourseCodeOrderByLectureDateDesc(courseCode).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
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

    private String generateSessionCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder code = new StringBuilder();
        java.util.Random rnd = new java.util.Random();
        for (int i = 0; i < 6; i++) {
            code.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return code.toString();
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; 
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c * 1000;
    }
}
