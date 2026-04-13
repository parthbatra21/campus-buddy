package com.campus_buddy.booking_service.service;

import com.campus_buddy.booking_service.model.Booking;
import com.campus_buddy.booking_service.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;

    public List<Booking> getBookingsByDate(LocalDate date) {
        return bookingRepository.findAllByDate(date);
    }

    public Booking createBooking(Booking booking) {
        List<Booking> overlapping = bookingRepository.findOverlappingBookings(
                booking.getRoomId(),
                booking.getDate(),
                booking.getStartTime(),
                booking.getEndTime()
        );

        if (!overlapping.isEmpty()) {
            throw new RuntimeException("This room is already booked for the selected time slot.");
        }

        return bookingRepository.save(booking);
    }

    public void cancelBooking(String id, String userId) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        if (!booking.getUserId().equals(userId)) {
            throw new RuntimeException("You can only cancel your own bookings");
        }

        booking.setStatus("CANCELLED");
        bookingRepository.save(booking);
    }
}
