package com.campus_buddy.campus_service.service;

import com.campus_buddy.campus_service.model.Facility;
import com.campus_buddy.campus_service.model.FacilityBooking;
import com.campus_buddy.campus_service.repository.FacilityBookingRepository;
import com.campus_buddy.campus_service.repository.FacilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FacilityService {

    private final FacilityRepository facilityRepository;
    private final FacilityBookingRepository facilityBookingRepository;

    public List<Facility> getAllFacilities() {
        return facilityRepository.findAll();
    }

    public List<FacilityBooking> getBookingsForUser(String userEmail) {
        return facilityBookingRepository.findByUserEmailOrderByDateDescStartTimeDesc(userEmail);
    }

    public FacilityBooking createBooking(FacilityBooking bookingRequest) {
        // Validate facility exists
        facilityRepository.findById(bookingRequest.getFacilityId())
                .orElseThrow(() -> new IllegalArgumentException("Facility not found"));

        if(bookingRequest.getStartTime().isAfter(bookingRequest.getEndTime()) || bookingRequest.getStartTime().equals(bookingRequest.getEndTime())) {
             throw new IllegalArgumentException("Start time must be before end time");
        }

        // Check for conflicts
        List<FacilityBooking> existingBookings = facilityBookingRepository
                .findByFacilityIdAndDateAndStatus(bookingRequest.getFacilityId(), bookingRequest.getDate(), "APPROVED");

        boolean hasConflict = existingBookings.stream().anyMatch(existing -> {
            LocalTime existingStart = existing.getStartTime();
            LocalTime existingEnd = existing.getEndTime();
            LocalTime newStart = bookingRequest.getStartTime();
            LocalTime newEnd = bookingRequest.getEndTime();

            // Conflict if new booking overlaps with existing booking
            // (StartA <= EndB) and (EndA >= StartB)
            return (newStart.isBefore(existingEnd) || newStart.equals(existingEnd)) &&
                   (newEnd.isAfter(existingStart) || newEnd.equals(existingStart)) &&
                   (!newStart.equals(existingEnd)) && // Touching at the exact boundary is fine
                   (!newEnd.equals(existingStart));
        });

        if (hasConflict) {
            throw new IllegalStateException("Facility is already booked for this time slot.");
        }

        // Auto-approve for now
        bookingRequest.setStatus("APPROVED");
        return facilityBookingRepository.save(bookingRequest);
    }
}
