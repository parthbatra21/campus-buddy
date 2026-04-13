package com.campus_buddy.notice_service.repository;

import com.campus_buddy.notice_service.model.NoticeRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NoticeReadRepository extends JpaRepository<NoticeRead, NoticeRead.NoticeReadId> {
    List<NoticeRead> findAllById_UserId(String userId);
}
