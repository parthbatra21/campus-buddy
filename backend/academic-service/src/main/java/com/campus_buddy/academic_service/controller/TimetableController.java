package com.campus_buddy.academic_service.controller;

import com.campus_buddy.academic_service.model.Timetable;
import com.campus_buddy.academic_service.repository.TimetableRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/timetable")
public class TimetableController {

    @Autowired
    private TimetableRepository timetableRepository;

    @GetMapping
    public ResponseEntity<?> getTimetable() {
        // Return full timetable sorted by day and time
        return ResponseEntity.ok(timetableRepository.findByOrderByDayOfWeekAscStartTimeAsc());
    }

    @PostMapping
    public ResponseEntity<?> addClass(@RequestBody Timetable timetable) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        // Verify FACULTY role
        boolean isFaculty = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_FACULTY"));
        
        if (!isFaculty) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Access denied. Only faculty can modify the timetable.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }

        timetable.setFacultyEmail(auth.getName());
        Timetable saved = timetableRepository.save(timetable);
        return ResponseEntity.ok(saved);
    }
}
