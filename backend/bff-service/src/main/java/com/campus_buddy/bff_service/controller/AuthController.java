package com.campus_buddy.bff_service.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

/**
 * BFF Auth Controller - Proxies auth requests to Auth Service
 * Frontend calls BFF, BFF forwards to Auth Service
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final WebClient webClient;

    @Value("${services.auth.url}")
    private String authServiceUrl;

    public AuthController(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    /**
     * Proxy login request to Auth Service
     * POST /api/auth/login -> Auth Service POST /auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody String loginRequest) {
        return webClient.post()
                .uri(authServiceUrl + "/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(loginRequest)
                .retrieve()
                .toEntity(String.class)
                .map(entity -> ResponseEntity.status(entity.getStatusCode())
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(entity.getBody()))
                .onErrorResume(WebClientResponseException.class, e -> 
                    Mono.just(ResponseEntity.status(e.getStatusCode())
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(e.getResponseBodyAsString()))
                )
                .onErrorResume(e -> Mono.just(ResponseEntity.status(500)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"error\":\"Auth service unavailable\"}")))
                .block();
    }

    /**
     * Proxy register request to Auth Service
     * POST /api/auth/register -> Auth Service POST /auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody String registerRequest) {
        return webClient.post()
                .uri(authServiceUrl + "/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(registerRequest)
                .retrieve()
                .toEntity(String.class)
                .map(entity -> ResponseEntity.status(entity.getStatusCode())
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(entity.getBody()))
                .onErrorResume(WebClientResponseException.class, e -> 
                    Mono.just(ResponseEntity.status(e.getStatusCode())
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(e.getResponseBodyAsString()))
                )
                .onErrorResume(e -> Mono.just(ResponseEntity.status(500)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"error\":\"Auth service unavailable\"}")))
                .block();
    }

    /**
     * Proxy /me request to Auth Service (requires JWT)
     * GET /api/auth/me -> Auth Service GET /auth/me
     */
    @GetMapping("/me")
    public ResponseEntity<String> getCurrentUser(@RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {
        return webClient.get()
                .uri(authServiceUrl + "/auth/me")
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .retrieve()
                .toEntity(String.class)
                .map(entity -> ResponseEntity.status(entity.getStatusCode())
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(entity.getBody()))
                .onErrorResume(WebClientResponseException.class, e -> 
                    Mono.just(ResponseEntity.status(e.getStatusCode())
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(e.getResponseBodyAsString()))
                )
                .onErrorResume(e -> {
                    e.printStackTrace();
                    return Mono.just(ResponseEntity.status(500)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"error\":\"Auth service unavailable\"}"));
                })
                .block();
    }
}
