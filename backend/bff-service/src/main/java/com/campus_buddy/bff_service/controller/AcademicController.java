package com.campus_buddy.bff_service.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

/**
 * BFF Academic Controller - Proxies academic requests to Academic Service
 * All requests require JWT authentication
 */
@RestController
@RequestMapping("/api/academic")
public class AcademicController {

    private final WebClient webClient;

    @Value("${services.academic.url}")
    private String academicServiceUrl;

    public AcademicController(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    /**
     * Proxy test request to Academic Service
     * GET /api/academic/test -> Academic Service GET /test
     */
    @GetMapping("/test")
    public ResponseEntity<String> test(@RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {
        return webClient.get()
                .uri(academicServiceUrl + "/test")
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .retrieve()
                .toEntity(String.class)
                .map(entity -> ResponseEntity.status(entity.getStatusCode())
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(entity.getBody()))
                .onErrorResume(e -> Mono.just(ResponseEntity.status(500).body("{\"error\":\"Academic service unavailable\"}")))
                .block();
    }

    /**
     * Proxy session creation request to Academic Service (Faculty only)
     * POST /api/academic/attendance/session -> Academic Service POST /attendance/session
     */
    @PostMapping("/attendance/session")
    public ResponseEntity<String> createSession(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @RequestBody String requestBody) {
        return webClient.post()
                .uri(academicServiceUrl + "/attendance/session")
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .header(HttpHeaders.CONTENT_TYPE, "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .toEntity(String.class)
                .map(entity -> ResponseEntity.status(entity.getStatusCode())
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(entity.getBody()))
                .onErrorResume(e -> Mono.just(ResponseEntity.status(500).body("{\"error\":\"Failed to create session\"}")))
                .block();
    }

    /**
     * Proxy mark attendance request to Academic Service (Student only)
     * POST /api/academic/attendance/mark -> Academic Service POST /attendance/mark
     */
    @PostMapping("/attendance/mark")
    public ResponseEntity<String> markAttendance(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @RequestBody String requestBody) {
        return webClient.post()
                .uri(academicServiceUrl + "/attendance/mark")
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .header(HttpHeaders.CONTENT_TYPE, "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .toEntity(String.class)
                .map(entity -> ResponseEntity.status(entity.getStatusCode())
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(entity.getBody()))
                .onErrorResume(e -> Mono.just(ResponseEntity.status(500).body("{\"error\":\"Failed to mark attendance\"}")))
                .block();
    }

    /**
     * Proxy student attendance view request to Academic Service
     * GET /api/academic/attendance/student -> Academic Service GET /attendance/student
     */
    @GetMapping("/attendance/student")
    public ResponseEntity<String> getStudentAttendance(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {
        return webClient.get()
                .uri(academicServiceUrl + "/attendance/student")
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .retrieve()
                .toEntity(String.class)
                .map(entity -> ResponseEntity.status(entity.getStatusCode())
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(entity.getBody()))
                .onErrorResume(e -> Mono.just(ResponseEntity.status(500).body("{\"error\":\"Failed to fetch attendance\"}")))
                .block();
    }

    /**
     * Proxy faculty course attendance view request to Academic Service (Faculty only)
     * GET /api/academic/attendance/faculty/{courseCode} -> Academic Service GET /attendance/faculty/{courseCode}
     */
    @GetMapping("/attendance/faculty/{courseCode}")
    public ResponseEntity<String> getCourseAttendance(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @PathVariable String courseCode) {
        return webClient.get()
                .uri(academicServiceUrl + "/attendance/faculty/" + courseCode)
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .retrieve()
                .toEntity(String.class)
                .map(entity -> ResponseEntity.status(entity.getStatusCode())
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(entity.getBody()))
                .onErrorResume(e -> Mono.just(ResponseEntity.status(500).body("{\"error\":\"Failed to fetch course attendance\"}")))
                .block();
    }
}
