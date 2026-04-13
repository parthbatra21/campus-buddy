package com.campus_buddy.notice_service.service;

import com.campus_buddy.notice_service.dto.NoticeResponse;
import com.campus_buddy.notice_service.model.Notice;
import com.campus_buddy.notice_service.model.NoticeRead;
import com.campus_buddy.notice_service.repository.NoticeReadRepository;
import com.campus_buddy.notice_service.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final NoticeReadRepository noticeReadRepository;

    public List<NoticeResponse> getAllNotices(String userId) {
        List<Notice> notices = noticeRepository.findAllByOrderByCreatedAtDesc();
        Set<String> readNoticeIds = noticeReadRepository.findAllById_UserId(userId)
                .stream()
                .map(read -> read.getId().getNoticeId())
                .collect(Collectors.toSet());

        return notices.stream().map(notice -> NoticeResponse.builder()
                .id(notice.getId())
                .title(notice.getTitle())
                .body(notice.getBody())
                .category(notice.getCategory())
                .priority(notice.getPriority())
                .postedBy(notice.getPostedBy())
                .createdAt(notice.getCreatedAt())
                .expiresAt(notice.getExpiresAt())
                .attachmentUrl(notice.getAttachmentUrl())
                .isRead(readNoticeIds.contains(notice.getId()))
                .build()).collect(Collectors.toList());
    }

    public Notice createNotice(Notice notice) {
        notice.setCreatedAt(Instant.now());
        return noticeRepository.save(notice);
    }

    public void markAsRead(String noticeId, String userId) {
        NoticeRead.NoticeReadId id = new NoticeRead.NoticeReadId(noticeId, userId);
        if (!noticeReadRepository.existsById(id)) {
            noticeReadRepository.save(new NoticeRead(id, Instant.now()));
        }
    }
}
