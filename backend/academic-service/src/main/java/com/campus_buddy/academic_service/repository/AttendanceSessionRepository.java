package com.campus_buddy.academic_service.repository;

import com.campus_buddy.academic_service.model.AttendanceSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Repository for AttendanceSession entity
 * Validates session existence and expiry for attendance marking
 */
@Repository
public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, String> {

    /**
     * Find an active (non-expired) session by ID
     * @param id Session ID
     * @param currentTime Current timestamp
     * @return Optional session if valid and not expired
     */
    Optional<AttendanceSession> findByIdAndExpiryTimeAfter(String id, LocalDateTime currentTime);

    Optional<AttendanceSession> findBySessionCodeAndExpiryTimeAfter(String sessionCode, LocalDateTime currentTime);
}
