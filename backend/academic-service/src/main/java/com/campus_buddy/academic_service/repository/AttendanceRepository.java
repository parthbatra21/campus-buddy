package com.campus_buddy.academic_service.repository;

import com.campus_buddy.academic_service.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Attendance entity
 * Provides custom queries for student and faculty attendance views
 */
@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    /**
     * Get all attendance records for a specific student
     * @param studentEmail Student's email address
     * @return List of attendance records ordered by date (newest first)
     */
    List<Attendance> findByStudentEmailOrderByLectureDateDesc(String studentEmail);

    /**
     * Get all attendance records for a specific course
     * @param courseCode Course code
     * @return List of attendance records ordered by date (newest first)
     */
    List<Attendance> findByCourseCodeOrderByLectureDateDesc(String courseCode);
}
