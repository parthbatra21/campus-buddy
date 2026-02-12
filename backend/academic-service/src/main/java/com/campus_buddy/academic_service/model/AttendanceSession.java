package com.campus_buddy.academic_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * AttendanceSession Entity - represents a faculty-generated attendance window
 * Students must mark attendance using a valid, non-expired session
 */
@Entity
@Table(name = "attendance_session")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String courseCode;

    @Column(unique = true)
    private String sessionCode; // 6-digit code for accessibility

    @Column(nullable = false)
    private LocalDateTime expiryTime;

    @Column(nullable = false)
    private String createdBy; // Faculty email

    @Column(nullable = false)
    private LocalDateTime createdAt;

    // Geolocation fields
    private Double latitude;
    private Double longitude;
    private Double allowedRadius; // in meters, default 100

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (expiryTime == null) {
            // Default 10-minute expiry window
            expiryTime = LocalDateTime.now().plusMinutes(10);
        }
    }
}
