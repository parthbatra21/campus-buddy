package com.campus_buddy.notice_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Entity
@Table(name = "notices")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notice {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String body;

    @Column(nullable = false)
    private String category; // ACADEMIC, EVENTS, ADMIN, URGENT

    @Column(nullable = false)
    private String priority; // NORMAL, URGENT, PINNED

    @Column(nullable = false)
    private String postedBy; // User Email or ID

    private Instant expiresAt;

    private String attachmentUrl;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
