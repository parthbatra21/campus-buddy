package com.campus_buddy.campus_service.repository;

import com.campus_buddy.campus_service.model.FacilityBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface FacilityBookingRepository extends JpaRepository<FacilityBooking, Long> {
    List<FacilityBooking> findByUserEmailOrderByDateDescStartTimeDesc(String userEmail);
    List<FacilityBooking> findByFacilityIdAndDateAndStatus(Long facilityId, LocalDate date, String status);
}
