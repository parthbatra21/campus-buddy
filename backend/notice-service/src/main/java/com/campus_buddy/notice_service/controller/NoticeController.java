package com.campus_buddy.notice_service.controller;

import com.campus_buddy.notice_service.dto.NoticeResponse;
import com.campus_buddy.notice_service.model.Notice;
import com.campus_buddy.notice_service.service.NoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    @GetMapping
    public ResponseEntity<List<NoticeResponse>> getAllNotices(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(noticeService.getAllNotices(userId));
    }

    @PostMapping
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<Notice> createNotice(@RequestBody Notice notice, @AuthenticationPrincipal String userId) {
        notice.setPostedBy(userId);
        return ResponseEntity.ok(noticeService.createNotice(notice));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable String id, @AuthenticationPrincipal String userId) {
        noticeService.markAsRead(id, userId);
        return ResponseEntity.ok().build();
    }
}
