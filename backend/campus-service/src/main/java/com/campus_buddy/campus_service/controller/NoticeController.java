package com.campus_buddy.campus_service.controller;

import com.campus_buddy.campus_service.model.Notice;
import com.campus_buddy.campus_service.model.NoticePriority;
import com.campus_buddy.campus_service.repository.NoticeRepository;
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

@RestController
@RequestMapping("/notices")
public class NoticeController {

    private static final Logger log = LoggerFactory.getLogger(NoticeController.class);

    /**
     * Deterministic priority ordering map.
     * Ensures HIGH always comes first, regardless of alphabetical enum string ordering.
     */
    private static final Map<NoticePriority, Integer> PRIORITY_ORDER = Map.of(
        NoticePriority.HIGH, 1,
        NoticePriority.MEDIUM, 2,
        NoticePriority.LOW, 3
    );

    @Autowired
    private NoticeRepository noticeRepository;

    @GetMapping
    public ResponseEntity<?> getAllNotices(@RequestParam(defaultValue = "false") boolean archived) {
        try {
            List<Notice> notices = noticeRepository.findByArchivedOrderByCreatedAtDesc(archived);

            // Sort by priority (HIGH first), then by date (newest first)
            notices.sort(
                Comparator
                    .<Notice, Integer>comparing(n -> PRIORITY_ORDER.getOrDefault(n.getPriority(), 4))
                    .thenComparing(Notice::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
            );

            return ResponseEntity.ok(notices);
        } catch (Exception e) {
            log.error("Error fetching notices: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch notices."));
        }
    }

    @PostMapping
    public ResponseEntity<?> createNotice(@RequestBody Notice notice) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        boolean canPost = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equalsIgnoreCase("ROLE_FACULTY") || 
                                 role.equalsIgnoreCase("FACULTY") || 
                                 role.equalsIgnoreCase("ROLE_ADMIN") ||
                                 role.equalsIgnoreCase("ADMIN"));

        if (!canPost) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied. Only faculty or admins can post notices."));
        }

        try {
            notice.setPostedBy(auth.getName());
            notice.setArchived(false);
            Notice saved = noticeRepository.save(notice);
            log.info("Notice created: id={}, title='{}', by={}", saved.getId(), saved.getTitle(), saved.getPostedBy());
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("Error creating notice: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create notice: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/archive")
    public ResponseEntity<?> archiveNotice(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean canEdit = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equalsIgnoreCase("ROLE_FACULTY") || 
                                 role.equalsIgnoreCase("FACULTY") || 
                                 role.equalsIgnoreCase("ROLE_ADMIN") ||
                                 role.equalsIgnoreCase("ADMIN"));

        if (!canEdit) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied."));
        }

        return noticeRepository.findById(id)
                .map(notice -> {
                    notice.setArchived(true);
                    Notice saved = noticeRepository.save(notice);
                    log.info("Notice archived: id={} by={}", id, auth.getName());
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() -> {
                    log.warn("Attempted to archive non-existent notice: id={}", id);
                    return ResponseEntity.notFound().build();
                });
    }
}
