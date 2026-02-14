package com.campus_buddy.campus_service.repository;

import com.campus_buddy.campus_service.model.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long> {
    List<Notice> findByIsArchivedOrderByPriorityAscCreatedAtDesc(boolean isArchived);
}
