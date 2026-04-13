package com.campus_buddy.bff_service.controller;

import com.campus_buddy.bff_service.service.ScraperService;
import com.campus_buddy.bff_service.service.VectorStoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * AdminController — For managing the RAG system and vector store.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private ScraperService scraperService;

    @Autowired
    private VectorStoreService vectorStoreService;

    @PostMapping("/scrape")
    public ResponseEntity<Map<String, String>> triggerScrape() {
        scraperService.scrapeAll(); // Executes in a separate @Async thread
        return ResponseEntity.accepted().body(Map.of("message", "Scrape job triggered in background"));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        int count = vectorStoreService.getDocumentCount();
        return ResponseEntity.ok(Map.of(
            "documentCount", count,
            "status", count > 0 ? "healthy" : "empty"
        ));
    }
}
