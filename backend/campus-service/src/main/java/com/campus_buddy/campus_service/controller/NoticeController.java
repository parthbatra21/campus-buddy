package com.campus_buddy.campus_service.controller;

import com.campus_buddy.campus_service.model.Notice;
import com.campus_buddy.campus_service.repository.NoticeRepository;
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
@RequestMapping("/notices")
public class NoticeController {

    @Autowired
    private NoticeRepository noticeRepository;

    @GetMapping
    public ResponseEntity<List<Notice>> getAllNotices() {
        return ResponseEntity.ok(noticeRepository.findByOrderByPriorityAscCreatedAtDesc());
    }

    @PostMapping
    public ResponseEntity<?> createNotice(@RequestBody Notice notice) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // Verify FACULTY or ADMIN role
        boolean canPost = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_FACULTY") || role.equals("ROLE_ADMIN"));

        if (!canPost) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Access denied. Only faculty can post notices.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }

        notice.setPostedBy(auth.getName());
        Notice saved = noticeRepository.save(notice);
        return ResponseEntity.ok(saved);
    }
}
