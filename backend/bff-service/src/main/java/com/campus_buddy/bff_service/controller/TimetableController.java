package com.campus_buddy.bff_service.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/academic/timetable")
public class TimetableController {

    private final WebClient webClient;

    @Value("${services.academic.url}")
    private String academicServiceUrl;

    public TimetableController(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    @GetMapping
    public ResponseEntity<String> getTimetable(@RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {
        return webClient.get()
                .uri(academicServiceUrl + "/timetable")
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .retrieve()
                .toEntity(String.class)
                .map(entity -> ResponseEntity.status(entity.getStatusCode())
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(entity.getBody()))
                .onErrorResume(e -> Mono.just(ResponseEntity.status(500).body("{\"error\":\"Failed to fetch timetable\"}")))
                .block();
    }

    @PostMapping
    public ResponseEntity<String> addClass(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @RequestBody String requestBody) {
        return webClient.post()
                .uri(academicServiceUrl + "/timetable")
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .header(HttpHeaders.CONTENT_TYPE, "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .toEntity(String.class)
                .map(entity -> ResponseEntity.status(entity.getStatusCode())
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(entity.getBody()))
                .onErrorResume(e -> Mono.just(ResponseEntity.status(500).body("{\"error\":\"Failed to add class\"}")))
                .block();
    }
}
