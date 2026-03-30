package com.campus_buddy.academic_service.service;

import com.campus_buddy.academic_service.dto.*;
import com.campus_buddy.academic_service.model.Attendance;
import com.campus_buddy.academic_service.model.AttendanceSession;
import com.campus_buddy.academic_service.repository.AttendanceRepository;
import com.campus_buddy.academic_service.repository.AttendanceSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AttendanceService.
 * Covers: valid scan, duplicate attempt, expired session, invalid QR, geofencing.
 */
@ExtendWith(MockitoExtension.class)
class AttendanceServiceTest {

    @Mock
    private AttendanceRepository attendanceRepository;

    @Mock
    private AttendanceSessionRepository sessionRepository;

    @InjectMocks
    private AttendanceService attendanceService;

    private AttendanceSession validSession;
    private MarkAttendanceRequest validRequest;
    private final String studentEmail = "student@example.com";
    private final String facultyEmail = "faculty@example.com";

    @BeforeEach
    void setUp() {
        validSession = new AttendanceSession();
        validSession.setId("session-123");
        validSession.setSessionCode("ABC123");
        validSession.setCourseCode("CS101");
        validSession.setCreatedBy(facultyEmail);
        validSession.setExpiryTime(LocalDateTime.now().plusMinutes(5));
        validSession.setCreatedAt(LocalDateTime.now());
        validSession.setLatitude(28.6139);
        validSession.setLongitude(77.2090);
        validSession.setAllowedRadius(100.0);

        validRequest = new MarkAttendanceRequest();
        validRequest.setSessionCode("ABC123");
        validRequest.setCourseCode("CS101");
        validRequest.setLatitude(28.6139);  // Same location
        validRequest.setLongitude(77.2090);
    }

    // ─── Session Creation Tests ─────────────────────────────────────

    @Test
    @DisplayName("Create session — happy path")
    void createSession_shouldReturnSessionResponse() {
        CreateSessionRequest request = new CreateSessionRequest();
        request.setCourseCode("CS101");
        request.setLatitude(28.6139);
        request.setLongitude(77.2090);
        request.setAllowedRadius(100.0);

        AttendanceSession savedSession = new AttendanceSession();
        savedSession.setId("new-session-id");
        savedSession.setSessionCode("XYZ789");
        savedSession.setCourseCode("CS101");
        savedSession.setExpiryTime(LocalDateTime.now().plusMinutes(10));
        savedSession.setCreatedBy(facultyEmail);

        when(sessionRepository.save(any(AttendanceSession.class))).thenReturn(savedSession);

        SessionResponse response = attendanceService.createSession(request, facultyEmail);

        assertThat(response).isNotNull();
        assertThat(response.getSessionId()).isEqualTo("new-session-id");
        assertThat(response.getCourseCode()).isEqualTo("CS101");
        assertThat(response.getCreatedBy()).isEqualTo(facultyEmail);
        verify(sessionRepository, times(1)).save(any(AttendanceSession.class));
    }

    // ─── Mark Attendance Tests ──────────────────────────────────────

    @Test
    @DisplayName("Mark attendance — valid scan succeeds")
    void markAttendance_validScan_shouldSucceed() {
        when(sessionRepository.findBySessionCodeAndExpiryTimeAfter(eq("ABC123"), any(LocalDateTime.class)))
                .thenReturn(Optional.of(validSession));
        when(attendanceRepository.existsByStudentEmailAndQrSessionId(studentEmail, "session-123"))
                .thenReturn(false);

        Attendance savedAttendance = createSavedAttendance();
        when(attendanceRepository.save(any(Attendance.class))).thenReturn(savedAttendance);

        AttendanceResponse response = attendanceService.markAttendance(validRequest, studentEmail);

        assertThat(response).isNotNull();
        assertThat(response.getStudentEmail()).isEqualTo(studentEmail);
        assertThat(response.getCourseCode()).isEqualTo("CS101");
        assertThat(response.getStatus()).isEqualTo("PRESENT");
        verify(attendanceRepository, times(1)).save(any(Attendance.class));
    }

    @Test
    @DisplayName("Mark attendance — duplicate attempt returns error")
    void markAttendance_duplicateAttempt_shouldThrowIllegalState() {
        when(sessionRepository.findBySessionCodeAndExpiryTimeAfter(eq("ABC123"), any(LocalDateTime.class)))
                .thenReturn(Optional.of(validSession));
        when(attendanceRepository.existsByStudentEmailAndQrSessionId(studentEmail, "session-123"))
                .thenReturn(true);

        assertThatThrownBy(() -> attendanceService.markAttendance(validRequest, studentEmail))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already marked");

        verify(attendanceRepository, never()).save(any(Attendance.class));
    }

    @Test
    @DisplayName("Mark attendance — expired session returns error")
    void markAttendance_expiredSession_shouldThrowIllegalArgument() {
        // Session found by query (edge case: found just before expiry)
        // but by the time we re-check, it's expired
        validSession.setExpiryTime(LocalDateTime.now().minusSeconds(1));

        when(sessionRepository.findBySessionCodeAndExpiryTimeAfter(eq("ABC123"), any(LocalDateTime.class)))
                .thenReturn(Optional.of(validSession));

        assertThatThrownBy(() -> attendanceService.markAttendance(validRequest, studentEmail))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("expired");

        verify(attendanceRepository, never()).save(any(Attendance.class));
    }

    @Test
    @DisplayName("Mark attendance — invalid session code returns error")
    void markAttendance_invalidSessionCode_shouldThrowIllegalArgument() {
        when(sessionRepository.findBySessionCodeAndExpiryTimeAfter(eq("ABC123"), any(LocalDateTime.class)))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> attendanceService.markAttendance(validRequest, studentEmail))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid or expired");

        verify(attendanceRepository, never()).save(any(Attendance.class));
    }

    @Test
    @DisplayName("Mark attendance — no session code or ID returns error")
    void markAttendance_noSessionIdentifier_shouldThrowIllegalArgument() {
        MarkAttendanceRequest emptyRequest = new MarkAttendanceRequest();

        assertThatThrownBy(() -> attendanceService.markAttendance(emptyRequest, studentEmail))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Session ID or Session Code");
    }

    @Test
    @DisplayName("Mark attendance — course code mismatch returns error")
    void markAttendance_courseCodeMismatch_shouldThrowIllegalArgument() {
        validRequest.setCourseCode("CS999"); // Wrong course

        when(sessionRepository.findBySessionCodeAndExpiryTimeAfter(eq("ABC123"), any(LocalDateTime.class)))
                .thenReturn(Optional.of(validSession));

        assertThatThrownBy(() -> attendanceService.markAttendance(validRequest, studentEmail))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Course code does not match");
    }

    // ─── Geofencing Tests ───────────────────────────────────────────

    @Test
    @DisplayName("Mark attendance — geofencing violation returns error")
    void markAttendance_outsideRadius_shouldThrowIllegalArgument() {
        // Set student location far away (e.g., different city)
        validRequest.setLatitude(19.0760); // Mumbai latitude
        validRequest.setLongitude(72.8777); // Mumbai longitude

        when(sessionRepository.findBySessionCodeAndExpiryTimeAfter(eq("ABC123"), any(LocalDateTime.class)))
                .thenReturn(Optional.of(validSession));

        assertThatThrownBy(() -> attendanceService.markAttendance(validRequest, studentEmail))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("away");

        verify(attendanceRepository, never()).save(any(Attendance.class));
    }

    @Test
    @DisplayName("Mark attendance — missing student location when geofence enabled returns error")
    void markAttendance_missingStudentLocation_shouldThrowIllegalArgument() {
        validRequest.setLatitude(null);
        validRequest.setLongitude(null);

        when(sessionRepository.findBySessionCodeAndExpiryTimeAfter(eq("ABC123"), any(LocalDateTime.class)))
                .thenReturn(Optional.of(validSession));

        assertThatThrownBy(() -> attendanceService.markAttendance(validRequest, studentEmail))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Location permission");
    }

    @Test
    @DisplayName("Mark attendance — no geofence configured skips location check")
    void markAttendance_noGeofence_shouldSkipLocationCheck() {
        validSession.setLatitude(null);
        validSession.setLongitude(null);
        validRequest.setLatitude(null);
        validRequest.setLongitude(null);

        when(sessionRepository.findBySessionCodeAndExpiryTimeAfter(eq("ABC123"), any(LocalDateTime.class)))
                .thenReturn(Optional.of(validSession));
        when(attendanceRepository.existsByStudentEmailAndQrSessionId(studentEmail, "session-123"))
                .thenReturn(false);

        Attendance savedAttendance = createSavedAttendance();
        when(attendanceRepository.save(any(Attendance.class))).thenReturn(savedAttendance);

        AttendanceResponse response = attendanceService.markAttendance(validRequest, studentEmail);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("PRESENT");
    }

    // ─── Session ID Lookup Test ─────────────────────────────────────

    @Test
    @DisplayName("Mark attendance — lookup by session ID succeeds")
    void markAttendance_bySessionId_shouldSucceed() {
        MarkAttendanceRequest idRequest = new MarkAttendanceRequest();
        idRequest.setSessionId("session-123");
        idRequest.setLatitude(28.6139);
        idRequest.setLongitude(77.2090);

        when(sessionRepository.findByIdAndExpiryTimeAfter(eq("session-123"), any(LocalDateTime.class)))
                .thenReturn(Optional.of(validSession));
        when(attendanceRepository.existsByStudentEmailAndQrSessionId(studentEmail, "session-123"))
                .thenReturn(false);

        Attendance savedAttendance = createSavedAttendance();
        when(attendanceRepository.save(any(Attendance.class))).thenReturn(savedAttendance);

        AttendanceResponse response = attendanceService.markAttendance(idRequest, studentEmail);

        assertThat(response).isNotNull();
        verify(sessionRepository).findByIdAndExpiryTimeAfter(eq("session-123"), any(LocalDateTime.class));
    }

    // ─── Helper ─────────────────────────────────────────────────────

    private Attendance createSavedAttendance() {
        Attendance attendance = new Attendance();
        attendance.setId(1L);
        attendance.setStudentEmail(studentEmail);
        attendance.setCourseCode("CS101");
        attendance.setQrSessionId("session-123");
        attendance.setLectureDate(LocalDate.now());
        attendance.setStatus("PRESENT");
        attendance.setMarkedAt(LocalDateTime.now());
        return attendance;
    }
}
