package com.campus_buddy.bff_service.controller;

import com.campus_buddy.bff_service.service.ImageProcessingService;
import com.campus_buddy.bff_service.service.RAGService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpHeaders;

/**
 * CopilotController — The API endpoint for Campus Copilot chat and AI features.
 */
@RestController
@RequestMapping("/api/copilot")
public class CopilotController {

    @Autowired
    private RAGService ragService;

    @Autowired
    private ImageProcessingService imageProcessingService;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RestTemplate restTemplate;

    /**
     * Standard text chat endpoint.
     */
    @PostMapping("/ask")
    public ResponseEntity<java.util.Map<String, Object>> askCopilot(@RequestBody java.util.Map<String, String> request, @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader) {
        // Frontend sends "query"
        String message = request.getOrDefault("query", request.getOrDefault("message", ""));
        
        if (message.isBlank()) {
            return ResponseEntity.badRequest().body(createError("Message cannot be empty"));
        }

        // Simplistic intent routing
        String lowerMessage = message.toLowerCase();
        
        // 1. Route attendance queries to Academic service
        if (lowerMessage.contains("attendance") && (lowerMessage.contains("my") || lowerMessage.contains("marked"))) {
            return routeToAcademicAttendance(authHeader);
        }

        // 2. Default: Route to RAG Engine
        java.util.Map<String, Object> response = ragService.askCopilot(message);
        return ResponseEntity.ok(response);
    }

    /**
     * Submit an image for async extraction.
     */
    @PostMapping("/image")
    public ResponseEntity<java.util.Map<String, Object>> processImage(@RequestBody JsonNode request) {
        String base64Image = request.path("image").asText("");
        // Frontend sends "text"
        String prompt = request.path("text").isMissingNode() ? 
                         request.path("prompt").asText(null) : 
                         request.path("text").asText();
        
        if (base64Image.isBlank()) {
            return ResponseEntity.badRequest().body(createError("Image data cannot be empty"));
        }

        String taskId = imageProcessingService.submitImageTask(base64Image, prompt);
        
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("taskId", taskId);
        response.put("status", "processing");
        
        return ResponseEntity.accepted().body(response);
    }

    /**
     * Poll for image processing status.
     */
    @GetMapping("/image/status/{taskId}")
    public ResponseEntity<java.util.Map<String, Object>> getImageStatus(@PathVariable String taskId) {
        ObjectNode status = imageProcessingService.getTaskStatus(taskId);
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        if (status != null) {
            status.fieldNames().forEachRemaining(key -> result.put(key, status.get(key).asText()));
        }
        return ResponseEntity.ok(result);
    }

    // ─── Routing Helpers ───────────────────────────────────────────────

    @Value("${services.academic.url:http://academic-service:8082}")
    private String academicServiceUrl;

    private ResponseEntity<java.util.Map<String, Object>> routeToAcademicAttendance(String authHeader) {
        if (authHeader == null) {
            return ResponseEntity.status(401).body(createError("Authentication required to view attendance"));
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.AUTHORIZATION, authHeader);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    academicServiceUrl + "/attendance/student",
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            java.util.Map<String, Object> body = new java.util.HashMap<>();
            body.put("type", "text");
            body.put("text", "Here are your latest attendance records:\n\n" + response.getBody());
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(createError("Failed to fetch attendance records."));
        }
    }

    private java.util.Map<String, Object> createError(String message) {
        java.util.Map<String, Object> error = new java.util.HashMap<>();
        error.put("type", "error");
        error.put("text", message);
        return error;
    }
}
