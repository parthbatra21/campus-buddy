package com.campus_buddy.notice_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Entity
@Table(name = "notice_reads")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NoticeRead {
    @EmbeddedId
    private NoticeReadId id;

    @Column(nullable = false)
    private Instant readAt = Instant.now();
    
    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NoticeReadId implements java.io.Serializable {
        private String noticeId;
        private String userId;
    }
}
