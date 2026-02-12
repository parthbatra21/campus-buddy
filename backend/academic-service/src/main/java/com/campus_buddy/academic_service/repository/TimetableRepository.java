package com.campus_buddy.academic_service.repository;

import com.campus_buddy.academic_service.model.Timetable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimetableRepository extends JpaRepository<Timetable, Long> {
    List<Timetable> findByOrderByDayOfWeekAscStartTimeAsc();
    List<Timetable> findByFacultyEmail(String facultyEmail);
}
