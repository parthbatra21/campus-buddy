package com.campus_buddy.bff_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final RestTemplate restTemplate;

    @Value("${services.bookings.url}")
    private String bookingServiceUrl;

    @GetMapping
    public ResponseEntity<Object> getBookings(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", authHeader);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        String url = bookingServiceUrl + "/api/bookings";
        if (date != null) {
            url += "?date=" + date;
        }

        ResponseEntity<Object> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                Object.class
        );
        return sanitizeResponse(response);
    }

    @PostMapping
    public ResponseEntity<Object> createBooking(@RequestHeader("Authorization") String authHeader, @RequestBody Object booking) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", authHeader);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Object> entity = new HttpEntity<>(booking, headers);

        ResponseEntity<Object> response = restTemplate.exchange(
                bookingServiceUrl + "/api/bookings",
                HttpMethod.POST,
                entity,
                Object.class
        );
        return sanitizeResponse(response);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Object> cancelBooking(@RequestHeader("Authorization") String authHeader, @PathVariable String id) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", authHeader);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Object> response = restTemplate.exchange(
                bookingServiceUrl + "/api/bookings/" + id + "/cancel",
                HttpMethod.POST,
                entity,
                Object.class
        );
        return sanitizeResponse(response);
    }

    private ResponseEntity<Object> sanitizeResponse(ResponseEntity<Object> upstreamResponse) {
        HttpHeaders sanitizedHeaders = new HttpHeaders();
        sanitizedHeaders.addAll(upstreamResponse.getHeaders());
        sanitizedHeaders.remove(HttpHeaders.TRANSFER_ENCODING);
        sanitizedHeaders.remove(HttpHeaders.CONTENT_LENGTH);
        sanitizedHeaders.remove(HttpHeaders.CONNECTION);

        return new ResponseEntity<>(
                upstreamResponse.getBody(),
                sanitizedHeaders,
                upstreamResponse.getStatusCode()
        );
    }
}
