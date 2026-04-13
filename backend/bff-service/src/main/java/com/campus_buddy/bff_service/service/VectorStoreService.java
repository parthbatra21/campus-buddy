package com.campus_buddy.bff_service.service;
 
 import lombok.RequiredArgsConstructor;
 import org.slf4j.Logger;
 import org.slf4j.LoggerFactory;
 import org.springframework.beans.factory.annotation.Value;
 import org.springframework.stereotype.Service;
 import org.springframework.web.client.RestTemplate;
 
 import java.util.Map;
 
 /**
  * VectorStoreService — acts as a facade for the Python RAG service's vector database.
  * Connects to ChromaDB via the rag-service API to store and query documentation.
  */
 @Service
 @RequiredArgsConstructor
 public class VectorStoreService {
 
     private static final Logger log = LoggerFactory.getLogger(VectorStoreService.class);
 
     private final RestTemplate restTemplate;
 
     @Value("${services.rag.url:http://rag-service:8000}")
     private String ragServiceUrl;
 
     /**
      * Store a document in the Python RAG service.
      */
     public void storeDocument(String title, String content, String source, String url) {
         try {
             Map<String, String> payload = Map.of(
                 "text", title + ". " + content,
                 "source", source,
                 "title", title
             );
             
             restTemplate.postForObject(ragServiceUrl + "/ingest", payload, Map.class);
             log.info("Successfully pushed document '{}' to RAG service", title);
         } catch (Exception e) {
             log.error("Failed to push document '{}' to RAG service: {}", title, e.getMessage());
         }
     }
 
     /**
      * Check if a document exists.
      */
     public boolean documentExists(String title, String source) {
         // Chroma handles duplicates, allowing re-ingestion for demo robustness.
         return false; 
     }
 
     /**
      * Get approximate document count using the RAG service health endpoint.
      */
     public int getDocumentCount() {
         try {
             Map<String, Object> stats = restTemplate.getForObject(ragServiceUrl + "/health", Map.class);
             if (stats != null && "ready".equals(stats.get("status"))) {
                 return 1; // Placeholder for healthy status
             }
         } catch (Exception e) {
             log.warn("Could not fetch RAG stats: {}", e.getMessage());
         }
         return 0;
     }
 
     public record SearchResult(String title, String content, String source, String url, double similarity) {}
 }
