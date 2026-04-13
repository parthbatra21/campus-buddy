package com.campus_buddy.bff_service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * ImageProcessingService — Handles async image analysis using Gemini Vision.
 * Implements a lightweight in-memory task queue with scheduled cleanup.
 */
@Service
@EnableAsync
@EnableScheduling
public class ImageProcessingService {

    private static final Logger log = LoggerFactory.getLogger(ImageProcessingService.class);

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private RAGService ragService;

    @Autowired
    private ObjectMapper objectMapper;

    // In-memory store for async task results
    private final ConcurrentHashMap<String, TaskResult> taskStore = new ConcurrentHashMap<>();

    /**
     * Submit an image for async processing.
     * @return taskId
     */
    public String submitImageTask(String base64Image, String prompt) {
        String taskId = UUID.randomUUID().toString();
        taskStore.put(taskId, new TaskResult("processing", null, System.currentTimeMillis()));
        
        // Kick off async processing
        processImageAsync(taskId, base64Image, prompt);
        
        return taskId;
    }

    /**
     * Get the status of an image task.
     */
    public ObjectNode getTaskStatus(String taskId) {
        ObjectNode response = objectMapper.createObjectNode();
        TaskResult result = taskStore.get(taskId);
        
        if (result == null) {
            response.put("status", "error");
            response.put("error", "Task not found or expired");
            return response;
        }

        response.put("status", result.status);
        if ("complete".equals(result.status)) {
            response.put("type", "markdown");
            response.put("text", result.data);
            // Optionally remove task immediately upon successful fetch to free memory faster
            taskStore.remove(taskId); 
        } else if ("error".equals(result.status)) {
            response.put("error", result.data);
        }
        
        return response;
    }

    @Async
    protected void processImageAsync(String taskId, String base64Image, String prompt) {
        try {
            log.info("Starting vision processing for task {}", taskId);
            String markdownResult = geminiService.analyzeImage(base64Image, prompt);
            
            // Auto-ingest into RAG for "Whiteboard Feature"
            String timestamp = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
            ragService.ingestData(markdownResult, "Whiteboard", "Digitized Notes - " + timestamp);
            
            taskStore.put(taskId, new TaskResult("complete", markdownResult, System.currentTimeMillis()));
            log.info("Completed vision processing and indexing for task {}", taskId);
        } catch (Exception e) {
            log.error("Error processing image for task {}: {}", taskId, e.getMessage());
            taskStore.put(taskId, new TaskResult("error", "Failed to process image.", System.currentTimeMillis()));
        }
    }

    /**
     * Memory Leak Prevention: 
     * Sweep the map every 10 minutes and delete tasks older than 5 minutes.
     * This handles cases where a user uploads an image but closes the browser before polling.
     */
    @Scheduled(fixedRate = 600000) // Run every 10 minutes
    public void cleanupStaleTasks() {
        long now = System.currentTimeMillis();
        long threshold = TimeUnit.MINUTES.toMillis(5);
        
        int initialSize = taskStore.size();
        taskStore.entrySet().removeIf(entry -> (now - entry.getValue().timestamp) > threshold);
        
        int removedCount = initialSize - taskStore.size();
        if (removedCount > 0) {
            log.info("Cleaned up {} stale image processing tasks from memory.", removedCount);
        }
    }

    // Inner class for task tracking
    private static class TaskResult {
        String status; // "processing", "complete", "error"
        String data;
        long timestamp;

        TaskResult(String status, String data, long timestamp) {
            this.status = status;
            this.data = data;
            this.timestamp = timestamp;
        }
    }
}
