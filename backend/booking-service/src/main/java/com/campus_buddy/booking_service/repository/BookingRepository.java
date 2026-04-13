package com.campus_buddy.booking_service.repository;

import com.campus_buddy.booking_service.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, String> {
    
    List<Booking> findAllByDate(LocalDate date);
    
    List<Booking> findAllByRoomIdAndDate(String roomId, LocalDate date);

    @Query("SELECT b FROM Booking b WHERE b.roomId = :roomId AND b.date = :date AND b.status = 'CONFIRMED' AND " +
           "((b.startTime < :endTime AND b.endTime > :startTime))")
    List<Booking> findOverlappingBookings(
            @Param("roomId") String roomId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );
}
