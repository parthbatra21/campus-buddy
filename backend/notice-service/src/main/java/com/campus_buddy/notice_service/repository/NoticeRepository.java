package com.campus_buddy.notice_service.repository;

import com.campus_buddy.notice_service.model.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, String> {
    List<Notice> findAllByOrderByCreatedAtDesc();
}
