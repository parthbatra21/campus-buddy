package com.campus_buddy.academic_service.controller;

import com.campus_buddy.academic_service.model.Timetable;
import com.campus_buddy.academic_service.repository.TimetableRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * TimetableController — manages class schedules.
 *
 * TODO: Replace global timetable with user-specific filtering
 *       (department/section-based) once Enrollment model is introduced.
 *       See implementation_plan.md for design discussion.
 */
@RestController
@RequestMapping("/timetable")
public class TimetableController {

    private static final Logger log = LoggerFactory.getLogger(TimetableController.class);

    /**
     * Calendar-order mapping for day-of-week.
     * Ensures MONDAY=1, ..., SUNDAY=7 instead of alphabetical sort.
     */
    private static final Map<String, Integer> DAY_ORDER = Map.of(
        "MONDAY", 1,
        "TUESDAY", 2,
        "WEDNESDAY", 3,
        "THURSDAY", 4,
        "FRIDAY", 5,
        "SATURDAY", 6,
        "SUNDAY", 7
    );

    @Autowired
    private TimetableRepository timetableRepository;

    /**
     * GET /timetable — Returns the timetable sorted in proper calendar order.
     *
     * For FACULTY: returns only their own classes.
     * For STUDENT: returns full schedule (global view, to be replaced with
     *              enrollment-based filtering in future).
     */
    @GetMapping
    public ResponseEntity<?> getTimetable() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isFaculty = hasRole(auth, "ROLE_FACULTY");

        try {
            List<Timetable> entries;
            if (isFaculty) {
                entries = timetableRepository.findByFacultyEmail(auth.getName());
            } else {
                // TODO: Filter by student enrollment when Enrollment model is added
                entries = timetableRepository.findAll();
            }

            // Sort by calendar day order, then by start time
            entries.sort(
                Comparator
                    .<Timetable, Integer>comparing(t -> DAY_ORDER.getOrDefault(t.getDayOfWeek().toUpperCase(), 8))
                    .thenComparing(Timetable::getStartTime, Comparator.nullsLast(Comparator.naturalOrder()))
            );

            return ResponseEntity.ok(entries);
        } catch (Exception e) {
            log.error("Error fetching timetable: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch timetable."));
        }
    }

    /**
     * POST /timetable — Add a class to the timetable (FACULTY ONLY).
     * Validates for time-slot conflicts before saving.
     */
    @PostMapping
    public ResponseEntity<?> addClass(@RequestBody Timetable timetable) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (!hasRole(auth, "ROLE_FACULTY")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied. Only faculty can modify the timetable."));
        }

        // Validation
        if (timetable.getDayOfWeek() == null || timetable.getStartTime() == null || timetable.getEndTime() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "dayOfWeek, startTime, and endTime are required."));
        }

        if (!timetable.getStartTime().isBefore(timetable.getEndTime())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Start time must be before end time."));
        }

        // Check for overlapping entries in the same room on the same day
        List<Timetable> conflicts = timetableRepository.findByDayOfWeekAndRoomNumber(
                timetable.getDayOfWeek().toUpperCase(), timetable.getRoomNumber());

        boolean hasOverlap = conflicts.stream().anyMatch(existing ->
            timetable.getStartTime().isBefore(existing.getEndTime()) &&
            timetable.getEndTime().isAfter(existing.getStartTime())
        );

        if (hasOverlap) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Time slot conflict: this room is already booked for an overlapping time on " + timetable.getDayOfWeek() + "."));
        }

        timetable.setFacultyEmail(auth.getName());
        timetable.setDayOfWeek(timetable.getDayOfWeek().toUpperCase()); // Normalize
        Timetable saved = timetableRepository.save(timetable);
        log.info("Timetable entry added: course={}, day={}, room={}, by={}", saved.getCourseCode(), saved.getDayOfWeek(), saved.getRoomNumber(), auth.getName());
        return ResponseEntity.ok(saved);
    }

    private boolean hasRole(Authentication auth, String role) {
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(r -> r.equals(role));
    }
}
