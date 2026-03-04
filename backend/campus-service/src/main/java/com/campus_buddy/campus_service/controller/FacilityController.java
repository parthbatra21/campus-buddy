package com.campus_buddy.campus_service.controller;

import com.campus_buddy.campus_service.model.Facility;
import com.campus_buddy.campus_service.model.FacilityBooking;
import com.campus_buddy.campus_service.service.FacilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/facilities")
@RequiredArgsConstructor
public class FacilityController {

    private final FacilityService facilityService;

    @GetMapping
    public ResponseEntity<List<Facility>> getAllFacilities() {
        return ResponseEntity.ok(facilityService.getAllFacilities());
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<FacilityBooking>> getMyBookings(@RequestParam String userEmail) {
        return ResponseEntity.ok(facilityService.getBookingsForUser(userEmail));
    }

    @PostMapping("/bookings")
    public ResponseEntity<?> createBooking(@RequestBody FacilityBooking bookingRequest, @RequestParam String userEmail) {
        try {
            bookingRequest.setUserEmail(userEmail);
            FacilityBooking savedBooking = facilityService.createBooking(bookingRequest);
            return ResponseEntity.ok(savedBooking);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("An error occurred while creating the booking: " + e.getMessage());
        }
    }
}
