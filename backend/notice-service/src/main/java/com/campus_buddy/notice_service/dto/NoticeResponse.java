package com.campus_buddy.notice_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoticeResponse {
    private String id;
    private String title;
    private String body;
    private String category;
    private String priority;
    private String postedBy;
    private Instant createdAt;
    private Instant expiresAt;
    private String attachmentUrl;
    private boolean isRead;
}
