package com.campus_buddy.academic_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Attendance Entity - tracks individual attendance records
 * Each record represents a student's attendance for a specific course on a specific date
 */
@Entity
@Table(name = "attendance", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"student_email", "course_code", "lecture_date"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String studentEmail;

    @Column(nullable = false)
    private String courseCode;

    @Column(nullable = false)
    private LocalDate lectureDate;

    @Column(nullable = false)
    private String status; // "PRESENT", "LATE", etc.

    @Column(nullable = false)
    private String qrSessionId;

    @Column(nullable = false)
    private LocalDateTime markedAt;

    @PrePersist
    protected void onCreate() {
        if (this.markedAt == null) {
            this.markedAt = LocalDateTime.now();
        }
        if (this.lectureDate == null) {
            this.lectureDate = LocalDate.now();
        }
        if (this.status == null) {
            this.status = "PRESENT";
        }
    }
}
