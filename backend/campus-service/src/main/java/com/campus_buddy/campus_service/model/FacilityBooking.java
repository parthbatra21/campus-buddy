package com.campus_buddy.campus_service.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Data
public class FacilityBooking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long facilityId;
    private String userEmail;
    private String clubName; // Optional club association
    
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    
    private String status; // PENDING, APPROVED, REJECTED
    private String purpose;
}
