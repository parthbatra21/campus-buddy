package com.campus_buddy.bff_service.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/campus/facilities")
public class FacilityController {

    private final WebClient webClient;

    @Value("${services.campus.url}")
    private String campusServiceUrl;

    public FacilityController(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    @GetMapping
    public ResponseEntity<String> getAllFacilities(@RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {
        return webClient.get()
                .uri(campusServiceUrl + "/facilities")
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .retrieve()
                .toEntity(String.class)
                .map(entity -> ResponseEntity.status(entity.getStatusCode())
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(entity.getBody()))
                .onErrorResume(e -> Mono.just(ResponseEntity.status(500).body("{\"error\":\"Failed to fetch facilities\"}")))
                .block();
    }

    @GetMapping("/bookings")
    public ResponseEntity<String> getMyBookings(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @RequestParam String userEmail) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("http") // or however it's configured, assuming campusServiceUrl has scheme
                        .host(campusServiceUrl.replace("http://", "").split(":")[0])
                        .port(campusServiceUrl.split(":")[2])
                        .path("/facilities/bookings")
                        .queryParam("userEmail", userEmail)
                        .build())
                // Alternative safer URI building:
                // .uri(campusServiceUrl + "/facilities/bookings?userEmail=" + userEmail)
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .retrieve()
                .toEntity(String.class)
                .map(entity -> ResponseEntity.status(entity.getStatusCode())
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(entity.getBody()))
                .onErrorResume(e -> Mono.just(ResponseEntity.status(500).body("{\"error\":\"Failed to fetch bookings\"}")))
                .block();
    }

    @PostMapping("/bookings")
    public ResponseEntity<String> createBooking(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @RequestParam String userEmail,
            @RequestBody String requestBody) {
        return webClient.post()
                .uri(campusServiceUrl + "/facilities/bookings?userEmail=" + userEmail)
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .header(HttpHeaders.CONTENT_TYPE, "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .toEntity(String.class)
                .map(entity -> ResponseEntity.status(entity.getStatusCode())
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(entity.getBody()))
                .onErrorResume(e -> Mono.just(ResponseEntity.status(500).body("{\"error\":\"Failed to create booking: " + e.getMessage() + "\"}")))
                .block();
    }
}
