package com.campus_buddy.booking_service.controller;

import com.campus_buddy.booking_service.model.Booking;
import com.campus_buddy.booking_service.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @GetMapping
    public ResponseEntity<List<Booking>> getBookings(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDate searchDate = (date != null) ? date : LocalDate.now();
        return ResponseEntity.ok(bookingService.getBookingsByDate(searchDate));
    }

    @PostMapping
    public ResponseEntity<Booking> createBooking(@RequestBody Booking booking, @AuthenticationPrincipal String userId) {
        booking.setUserId(userId);
        return ResponseEntity.ok(bookingService.createBooking(booking));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelBooking(@PathVariable String id, @AuthenticationPrincipal String userId) {
        bookingService.cancelBooking(id, userId);
        return ResponseEntity.ok().build();
    }
}
