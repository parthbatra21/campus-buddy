package com.campus_buddy.bff_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final RestTemplate restTemplate;

    @Value("${services.notices.url}")
    private String noticeServiceUrl;

    @GetMapping
    public ResponseEntity<Object> getAllNotices(@RequestHeader("Authorization") String authHeader) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", authHeader);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Object> response = restTemplate.exchange(
                noticeServiceUrl + "/api/notices",
                HttpMethod.GET,
                entity,
                Object.class
        );
        return sanitizeResponse(response);
    }

    @PostMapping
    public ResponseEntity<Object> createNotice(@RequestHeader("Authorization") String authHeader, @RequestBody Object notice) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", authHeader);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Object> entity = new HttpEntity<>(notice, headers);

        ResponseEntity<Object> response = restTemplate.exchange(
                noticeServiceUrl + "/api/notices",
                HttpMethod.POST,
                entity,
                Object.class
        );
        return sanitizeResponse(response);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Object> markAsRead(@RequestHeader("Authorization") String authHeader, @PathVariable String id) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", authHeader);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Object> response = restTemplate.exchange(
                noticeServiceUrl + "/api/notices/" + id + "/read",
                HttpMethod.POST,
                entity,
                Object.class
        );
        return sanitizeResponse(response);
    }

    private ResponseEntity<Object> sanitizeResponse(ResponseEntity<Object> upstreamResponse) {
        HttpHeaders sanitizedHeaders = new HttpHeaders();
        sanitizedHeaders.addAll(upstreamResponse.getHeaders());
        // Remove problematic headers that cause duplicate header errors in Nginx/Spring
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
