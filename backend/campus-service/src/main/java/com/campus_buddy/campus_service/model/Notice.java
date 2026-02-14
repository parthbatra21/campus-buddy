package com.campus_buddy.campus_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notices")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 1000)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NoticeCategory category; // IMPORTANT, EVENT, GENERAL

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NoticePriority priority; // HIGH, MEDIUM, LOW

    @Column(nullable = false)
    private String postedBy; // Faculty/Admin email

    @Column(nullable = false)
    private boolean isArchived = false;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
