package com.campus_buddy.campus_service.service;

import com.campus_buddy.campus_service.model.Facility;
import com.campus_buddy.campus_service.model.FacilityBooking;
import com.campus_buddy.campus_service.repository.FacilityBookingRepository;
import com.campus_buddy.campus_service.repository.FacilityRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FacilityService {

    private static final Logger log = LoggerFactory.getLogger(FacilityService.class);

    private final FacilityRepository facilityRepository;
    private final FacilityBookingRepository facilityBookingRepository;

    public List<Facility> getAllFacilities() {
        return facilityRepository.findAll();
    }

    public List<FacilityBooking> getBookingsForUser(String userEmail) {
        return facilityBookingRepository.findByUserEmailOrderByDateDescStartTimeDesc(userEmail);
    }

    public FacilityBooking createBooking(FacilityBooking bookingRequest) {
        log.info("Creating booking: facility={}, user={}, date={}, {}-{}",
                bookingRequest.getFacilityId(), bookingRequest.getUserEmail(),
                bookingRequest.getDate(), bookingRequest.getStartTime(), bookingRequest.getEndTime());

        // Validate facility exists
        Facility facility = facilityRepository.findById(bookingRequest.getFacilityId())
                .orElseThrow(() -> new IllegalArgumentException("Facility not found with id: " + bookingRequest.getFacilityId()));

        if (bookingRequest.getStartTime() == null || bookingRequest.getEndTime() == null) {
            throw new IllegalArgumentException("Start time and end time are required.");
        }

        if (bookingRequest.getDate() == null) {
            throw new IllegalArgumentException("Booking date is required.");
        }

        if (bookingRequest.getDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Cannot book a facility in the past.");
        }

        if (bookingRequest.getStartTime().isAfter(bookingRequest.getEndTime()) || bookingRequest.getStartTime().equals(bookingRequest.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time.");
        }

        // Check for conflicts
        List<FacilityBooking> existingBookings = facilityBookingRepository
                .findByFacilityIdAndDateAndStatus(bookingRequest.getFacilityId(), bookingRequest.getDate(), "APPROVED");

        boolean hasConflict = existingBookings.stream().anyMatch(existing -> {
            LocalTime existingStart = existing.getStartTime();
            LocalTime existingEnd = existing.getEndTime();
            LocalTime newStart = bookingRequest.getStartTime();
            LocalTime newEnd = bookingRequest.getEndTime();

            // Overlap: starts before the other ends AND ends after the other starts
            // Adjacent slots (e.g., 10:00-11:00 and 11:00-12:00) are NOT conflicts
            return newStart.isBefore(existingEnd) && newEnd.isAfter(existingStart);
        });

        if (hasConflict) {
            log.warn("Booking conflict: facility={}, date={}, time={}-{}",
                    bookingRequest.getFacilityId(), bookingRequest.getDate(),
                    bookingRequest.getStartTime(), bookingRequest.getEndTime());
            throw new IllegalStateException("Facility '" + facility.getName() + "' is already booked for an overlapping time slot.");
        }

        // Auto-approve for now
        bookingRequest.setStatus("APPROVED");
        FacilityBooking saved = facilityBookingRepository.save(bookingRequest);
        log.info("Booking created successfully: id={}, facility='{}', user={}", saved.getId(), facility.getName(), saved.getUserEmail());
        return saved;
    }
}

