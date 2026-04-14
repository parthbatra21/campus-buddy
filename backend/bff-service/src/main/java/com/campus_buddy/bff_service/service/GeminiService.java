package com.campus_buddy.bff_service.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.List;

/**
 * GeminiService — HTTP client wrapping Google Gemini API.
 * Supports text generation, text embeddings, and vision (image analysis).
 */
@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);
    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${GEMINI_MODEL:gemini-1.5-flash-latest}")
    private String model;

    @Value("${GEMINI_EMBEDDING_MODEL:text-embedding-004}")
    private String embeddingModel;

    @Value("${gemini.api-base:https://generativelanguage.googleapis.com/v1}")
    private String apiBase;

    public GeminiService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
        this.objectMapper = new ObjectMapper();
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    /**
     * Generate text content using Gemini.
     *
     * @param userMessage The user's question
     * @param systemContext Retrieved RAG context to inject
     * @return Generated text response
     */
    public String generateContent(String userMessage, String systemContext) {
        if (!isConfigured()) {
            return fallbackResponse(userMessage);
        }

        try {
            // Diagnostic: Verify API Key is present
            if (apiKey == null || apiKey.length() < 10) {
                 log.error("CRITICAL: GEMINI_API_KEY is missing or too short!");
                 return fallbackResponse(userMessage);
            }
            log.debug("Using API Key starting with: {}...", apiKey.substring(0, 5));

            ObjectNode requestBody = objectMapper.createObjectNode();
            
            // Universal prompt format (v1 compatible)
            String fullPrompt = userMessage;
            if (systemContext != null && !systemContext.isBlank()) {
                fullPrompt = buildSystemPrompt(systemContext) + "\n\nUser Question: " + userMessage;
            }

            ArrayNode contents = objectMapper.createArrayNode();
            ObjectNode content = objectMapper.createObjectNode();
            content.put("role", "user");
            ObjectNode part = objectMapper.createObjectNode();
            part.put("text", fullPrompt);
            ArrayNode parts = objectMapper.createArrayNode();
            parts.add(part);
            content.set("parts", parts);
            contents.add(content);
            requestBody.set("contents", contents);

            ObjectNode genConfig = objectMapper.createObjectNode();
            genConfig.put("temperature", 0.7);
            genConfig.put("maxOutputTokens", 2048);
            requestBody.set("generationConfig", genConfig);

            String url = apiBase + "/models/" + model + ":generateContent?key=" + apiKey;
            log.info("Calling Gemini API: {}/models/{}:generateContent", apiBase, model);

            try {
                String responseJson = webClient.post()
                        .uri(url)
                        .header("Content-Type", "application/json")
                        .bodyValue(objectMapper.writeValueAsString(requestBody))
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();

                return extractTextFromResponse(responseJson);
            } catch (Exception e) {
                // Self-healing: If 404, try fallback model 'gemini-pro'
                if (e.getMessage().contains("404") && !model.equals("gemini-pro")) {
                    log.warn("Model {} failed with 404, attempting fallback to gemini-pro...", model);
                    String fallbackUrl = apiBase + "/models/gemini-pro:generateContent?key=" + apiKey;
                    String fallbackResponse = webClient.post()
                            .uri(fallbackUrl)
                            .header("Content-Type", "application/json")
                            .bodyValue(objectMapper.writeValueAsString(requestBody))
                            .retrieve()
                            .bodyToMono(String.class)
                            .block();
                    return extractTextFromResponse(fallbackResponse);
                }
                throw e; // Rethrow if not a 404 or already using fallback
            }

        } catch (Exception e) {
            log.error("Gemini call failed: {}", e.getMessage());
            if (e instanceof org.springframework.web.reactive.function.client.WebClientResponseException) {
                log.error("API Response Body: {}", ((org.springframework.web.reactive.function.client.WebClientResponseException)e).getResponseBodyAsString());
            }
            return "I'm having trouble connecting to my AI brain right now. Please try again in a moment.";
        }
    }

    /**
     * Generate embedding vector for text using Gemini Embedding API.
     *
     * @param text Text to embed
     * @return 768-dimensional float array
     */
    public float[] embedText(String text) {
        if (!isConfigured()) {
            log.warn("Gemini API key not configured, returning zero vector");
            return new float[768];
        }

        try {
            ObjectNode requestBody = objectMapper.createObjectNode();
            ObjectNode content = objectMapper.createObjectNode();
            ObjectNode part = objectMapper.createObjectNode();
            part.put("text", text);
            ArrayNode parts = objectMapper.createArrayNode();
            parts.add(part);
            content.set("parts", parts);
            requestBody.set("content", content);

            String url = apiBase + "/models/" + embeddingModel + ":embedContent?key=" + apiKey;

            String responseJson = webClient.post()
                    .uri(url)
                    .header("Content-Type", "application/json")
                    .bodyValue(objectMapper.writeValueAsString(requestBody))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return extractEmbeddingFromResponse(responseJson);

        } catch (Exception e) {
            log.error("Gemini embedText failed: {}", e.getMessage(), e);
            return new float[768];
        }
    }

    /**
     * Analyze an image using Gemini Vision capabilities.
     *
     * @param base64Image Base64-encoded image data
     * @param prompt User prompt for the image
     * @return Extracted/formatted text from the image
     */
    public String analyzeImage(String base64Image, String prompt) {
        if (!isConfigured()) {
            return "Image analysis requires a Gemini API key. Please configure GEMINI_API_KEY.";
        }

        try {
            ObjectNode requestBody = objectMapper.createObjectNode();

            ArrayNode contents = objectMapper.createArrayNode();
            ObjectNode content = objectMapper.createObjectNode();
            content.put("role", "user");

            ArrayNode parts = objectMapper.createArrayNode();

            // Text prompt
            ObjectNode textPart = objectMapper.createObjectNode();
            textPart.put("text", prompt != null && !prompt.isBlank() ? prompt :
                    "Extract all text, code, and diagrams from this image. " +
                    "Format the output as clean, structured Markdown with proper headings, " +
                    "code blocks (with language tags), bullet points, and mathematical notation. " +
                    "If you see diagrams, describe them in detail.");
            parts.add(textPart);

            // Image data
            ObjectNode imagePart = objectMapper.createObjectNode();
            ObjectNode inlineData = objectMapper.createObjectNode();
            // Strip data URI prefix if present
            String cleanBase64 = base64Image;
            if (cleanBase64.contains(",")) {
                cleanBase64 = cleanBase64.substring(cleanBase64.indexOf(",") + 1);
            }
            inlineData.put("mimeType", "image/jpeg");
            inlineData.put("data", cleanBase64);
            imagePart.set("inlineData", inlineData);
            parts.add(imagePart);

            content.set("parts", parts);
            contents.add(content);
            requestBody.set("contents", contents);

            // Generation config for vision
            ObjectNode genConfig = objectMapper.createObjectNode();
            genConfig.put("temperature", 0.3);
            genConfig.put("maxOutputTokens", 4096);
            requestBody.set("generationConfig", genConfig);

            String url = apiBase + "/models/" + model + ":generateContent?key=" + apiKey;

            String responseJson = webClient.post()
                    .uri(url)
                    .header("Content-Type", "application/json")
                    .bodyValue(objectMapper.writeValueAsString(requestBody))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return extractTextFromResponse(responseJson);

        } catch (Exception e) {
            log.error("Gemini analyzeImage failed: {}", e.getMessage(), e);
            return "Failed to analyze image. Please try again.";
        }
    }

    // ─── Helpers ────────────────────────────────────────────────────────

    private String buildSystemPrompt(String context) {
        return """
                You are Campus Copilot, an intelligent AI assistant for students at Manipal University Jaipur (MUJ).
                You help students find library books, study notes, plan their schedules, and answer academic queries.
                
                IMPORTANT RULES:
                - Be concise and helpful. Use bullet points and clear formatting.
                - When showing resources, include titles and links when available.
                - If you don't have enough information, say so honestly.
                - Format your responses in clean Markdown.
                - When listing items, use numbered lists with brief descriptions.
                
                RETRIEVED CONTEXT (use this to answer the student's question):
                """ + context;
    }

    private String extractTextFromResponse(String responseJson) throws Exception {
        JsonNode root = objectMapper.readTree(responseJson);
        JsonNode candidates = root.path("candidates");
        if (candidates.isArray() && !candidates.isEmpty()) {
            JsonNode parts = candidates.get(0).path("content").path("parts");
            if (parts.isArray() && !parts.isEmpty()) {
                return parts.get(0).path("text").asText("");
            }
        }
        // Check for error
        JsonNode error = root.path("error");
        if (!error.isMissingNode()) {
            log.error("Gemini API error: {}", error.path("message").asText());
            return "AI service encountered an error. Please try again.";
        }
        return "I couldn't generate a response. Please try rephrasing your question.";
    }

    private float[] extractEmbeddingFromResponse(String responseJson) throws Exception {
        JsonNode root = objectMapper.readTree(responseJson);
        JsonNode values = root.path("embedding").path("values");
        if (values.isArray()) {
            float[] embedding = new float[values.size()];
            for (int i = 0; i < values.size(); i++) {
                embedding[i] = (float) values.get(i).asDouble();
            }
            return embedding;
        }
        log.error("Failed to extract embedding from response");
        return new float[768];
    }

    private String fallbackResponse(String userMessage) {
        String lower = userMessage.toLowerCase();
        if (lower.contains("book") || lower.contains("library")) {
            return "📚 I can help you find library resources! However, my AI brain isn't configured yet. " +
                   "Please ask your administrator to set the `GEMINI_API_KEY` environment variable.";
        }
        if (lower.contains("note") || lower.contains("material") || lower.contains("pyq")) {
            return "📝 I'd love to help you find study materials! " +
                   "Set the `GEMINI_API_KEY` to enable my full AI capabilities.";
        }
        return "👋 I'm Campus Copilot! I'm currently running in limited mode. " +
               "Set the `GEMINI_API_KEY` environment variable to unlock my full potential.";
    }
}
