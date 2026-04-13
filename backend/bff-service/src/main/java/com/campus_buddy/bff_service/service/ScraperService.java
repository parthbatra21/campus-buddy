package com.campus_buddy.bff_service.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

/**
 * ScraperService — extracts data from MUJ Library and MUJ Toppers.
 * Stores it in pgvector. Uses demo fallback on failure.
 */
@Service
public class ScraperService {

    private static final Logger log = LoggerFactory.getLogger(ScraperService.class);

    @Autowired
    private VectorStoreService vectorStore;

    @Autowired
    private ResourceLoader resourceLoader;

    @Autowired
    private ObjectMapper objectMapper;


    /**
     * Run the scraping process automatically on application startup.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Async
    public void runStartupScrape() {
        log.info("Running automatic startup scrape...");
        // Scrape real sources, load fallback demo data if they fail or rate limit
        scrapeLibrary();
        scrapeToppers();
        loadDemoData(); // Always load demo data to ensure a robust demo experience
        log.info("Startup scrape completed. Vector store has {} documents.", vectorStore.getDocumentCount());
    }

    @Async
    public void scrapeAll() {
        scrapeLibrary();
        scrapeToppers();
        loadDemoData();
    }

    public void scrapeLibrary() {
        try {
            Document doc = Jsoup.connect("https://library.jaipur.manipal.edu/").timeout(5000).get();
            Elements bookRows = doc.select("table.book-list tr");
            
            for (Element row : bookRows) {
                String title = row.select(".title").text();
                String author = row.select(".author").text();
                String url = row.select("a").attr("abs:href");
                
                if (!title.isEmpty()) {
                    String content = String.format("Author: %s. Available in MUJ Central Library.", author);
                    vectorStore.storeDocument(title, content, "MUJ Library OPAC", url);
                }
            }
        } catch (Exception e) {
            log.warn("Scraping MUJ Library failed: {}", e.getMessage());
        }
    }

    public void scrapeToppers() {
        try {
            Document doc = Jsoup.connect("https://mujtoppers.in").timeout(5000).get();
            Elements linkElements = doc.select("a[href*='notes'], a[href*='pyq']");
            
            for (Element link : linkElements) {
                String title = link.text();
                String url = link.attr("abs:href");
                
                if (!title.trim().isEmpty()) {
                    String content = "Study resource material provided by MUJ Toppers for " + title;
                    vectorStore.storeDocument(title, content, "MUJ Toppers", url);
                }
            }
        } catch (Exception e) {
            log.warn("Scraping mujtoppers.in failed: {}", e.getMessage());
        }
    }

    public void loadDemoData() {
        try {
            Resource resource = resourceLoader.getResource("classpath:demo-data.json");
            if (!resource.exists()) return;

            try (InputStream is = resource.getInputStream()) {
                List<DemoRecord> records = objectMapper.readValue(is, new TypeReference<List<DemoRecord>>() {});
                for (DemoRecord record : records) {
                    vectorStore.storeDocument(record.title, record.content, record.source, record.url);
                }
            }
        } catch (Exception e) {
            log.error("Failed to load demo data: {}", e.getMessage());
        }
    }

    // Record class for JSON parsing
    public record DemoRecord(String title, String content, String source, String url) {}
}
