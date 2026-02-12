package com.campus_buddy.bff_service.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/campus/notices")
public class NoticeController {

    private final WebClient webClient;

    @Value("${services.campus.url}")
    private String campusServiceUrl;

    public NoticeController(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    @GetMapping
    public ResponseEntity<String> getAllNotices(@RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {
        return webClient.get()
                .uri(campusServiceUrl + "/notices")
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .retrieve()
                .toEntity(String.class)
                .map(entity -> ResponseEntity.status(entity.getStatusCode())
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(entity.getBody()))
                .onErrorResume(e -> Mono.just(ResponseEntity.status(500).body("{\"error\":\"Failed to fetch notices\"}")))
                .block();
    }

    @PostMapping
    public ResponseEntity<String> createNotice(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @RequestBody String requestBody) {
        return webClient.post()
                .uri(campusServiceUrl + "/notices")
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .header(HttpHeaders.CONTENT_TYPE, "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .toEntity(String.class)
                .map(entity -> ResponseEntity.status(entity.getStatusCode())
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(entity.getBody()))
                .onErrorResume(e -> Mono.just(ResponseEntity.status(500).body("{\"error\":\"Failed to create notice\"}")))
                .block();
    }
}
