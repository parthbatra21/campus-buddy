package com.campus_buddy.bff_service.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import lombok.RequiredArgsConstructor;

/**
 * BFF Academic Controller - Proxies academic requests to Academic Service
 * All requests require JWT authentication
 */
@RestController
@RequestMapping("/api/academic")
@RequiredArgsConstructor
public class AcademicController {

    private final RestTemplate restTemplate;

    @Value("${services.academic.url:http://academic-service:8082}")
    private String academicServiceUrl;

    /**
     * Proxy test request to Academic Service
     * GET /api/academic/test -> Academic Service GET /test
     */
    @GetMapping("/test")
    public ResponseEntity<String> test(@RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, authHeader);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        return restTemplate.exchange(
                academicServiceUrl + "/test",
                HttpMethod.GET,
                entity,
                String.class
        );
    }

    @PostMapping("/attendance/session")
    public ResponseEntity<String> createSession(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @RequestBody String requestBody) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, authHeader);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

        return restTemplate.exchange(
                academicServiceUrl + "/attendance/session",
                HttpMethod.POST,
                entity,
                String.class
        );
    }

    @PostMapping("/attendance/mark")
    public ResponseEntity<String> markAttendance(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @RequestBody String requestBody) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, authHeader);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

        return restTemplate.exchange(
                academicServiceUrl + "/attendance/mark",
                HttpMethod.POST,
                entity,
                String.class
        );
    }

    @GetMapping("/attendance/student")
    public ResponseEntity<String> getStudentAttendance(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, authHeader);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        return restTemplate.exchange(
                academicServiceUrl + "/attendance/student",
                HttpMethod.GET,
                entity,
                String.class
        );
    }

    @GetMapping("/attendance/faculty/{courseCode}")
    public ResponseEntity<String> getCourseAttendance(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @PathVariable String courseCode) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, authHeader);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        return restTemplate.exchange(
                academicServiceUrl + "/attendance/faculty/" + courseCode,
                HttpMethod.GET,
                entity,
                String.class
        );
    }
}
