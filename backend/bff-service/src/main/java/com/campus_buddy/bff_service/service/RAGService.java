package com.campus_buddy.bff_service.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * RAGService — Retrieval-Augmented Generation orchestrator.
 * Now primarily delegates knowledge queries to the local Python RAG service.
 */
@Service
public class RAGService {

    private static final Logger log = LoggerFactory.getLogger(RAGService.class);

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${SERVICES_RAG_PYTHON_URL:http://rag-service:8000}")
    private String ragServiceUrl;

    /**
     * Process a user query using RAG.
     */
    public java.util.Map<String, Object> askCopilot(String query) {
        log.info("Processing Copilot query: '{}'", query);
        java.util.Map<String, Object> response = new java.util.HashMap<>();

        // 1. Intent routing logic for specialized features
        String lowerQuery = query.toLowerCase();
        if (lowerQuery.contains("plan") || lowerQuery.contains("schedule") || lowerQuery.contains("what should i do")) {
            return generatePlannerResponse(query);
        }

        // 2. Local RAG Flow for knowledge queries
        try {
            log.info("Retrieving context from local store via {}/retrieve", ragServiceUrl);
            
            java.util.Map<String, String> requestBody = new java.util.HashMap<>();
            requestBody.put("message", query);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<java.util.Map<String, String>> entity = new HttpEntity<>(requestBody, headers);

            String retrieveResponseStr = restTemplate.postForObject(
                    ragServiceUrl + "/retrieve",
                    entity,
                    String.class
            );

            if (retrieveResponseStr != null && !retrieveResponseStr.equals("{}")) {
                JsonNode retrieveResponse = objectMapper.readTree(retrieveResponseStr);
                String context = retrieveResponse.path("context").asText("");
                
                if (!context.isBlank()) {
                    log.info("Context retrieved ({} bytes), calling Gemini...", context.length());
                    String answer = geminiService.generateContent(query, context);
                    
                    response.put("type", "text");
                    response.put("text", answer);
                    
                    // Add sources
                    if (retrieveResponse.has("sources") && retrieveResponse.path("sources").isArray()) {
                        ArrayNode sources = (ArrayNode) retrieveResponse.path("sources");
                        if (sources.size() > 0) {
                            response.put("source", "Local Knowledge Base: " + sources.get(0).asText());
                        }
                    }
                    return response;
                }
            }
        } catch (Exception e) {
            log.warn("Local retrieval failed: {}. Falling back to general knowledge.", e.getMessage());
        }

        // 3. Fallback to Gemini
        try {
            String fallbackAnswer = geminiService.generateContent(query, null);
            response.put("type", "text");
            response.put("text", fallbackAnswer != null ? fallbackAnswer : "I'm currently warming up my AI brain. Please try again in a moment.");
            response.put("source", "Gemini AI");
        } catch (Exception e) {
            log.error("Gemini fallback failed: {}", e.getMessage());
            response.put("type", "text");
            response.put("text", "I'm having trouble connecting to my AI services. Please check your internet or configuration.");
        }
        
        return response;
    }

    /**
     * Specialized prompt for the Smart Planner.
     */
    private java.util.Map<String, Object> generatePlannerResponse(String query) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy"));
        
        String systemContext = String.format("""
            You are a smart academic planner for MUJ. 
            Today's date is %s.
            Provide a realistic study and task schedule based on the user's request.
            Format the response as a timeline or numbered list. No markdown headers.
            """, today);

        String planText = geminiService.generateContent(query, systemContext);
        
        response.put("type", "plan");
        response.put("text", planText);
        
        return response;
    }

    /**
     * Ingest raw text into the RAG vector store.
     */
    public void ingestData(String text, String source, String title) {
        log.info("Ingesting data into RAG: source={}, title={}", source, title);
        try {
            java.util.Map<String, String> requestBody = new java.util.HashMap<>();
            requestBody.put("text", text);
            requestBody.put("source", source);
            requestBody.put("title", title);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<java.util.Map<String, String>> entity = new HttpEntity<>(requestBody, headers);

            restTemplate.postForObject(
                    ragServiceUrl + "/ingest",
                    entity,
                    String.class
            );
        } catch (Exception e) {
            log.error("Failed to ingest data into RAG: {}", e.getMessage());
        }
    }
}
