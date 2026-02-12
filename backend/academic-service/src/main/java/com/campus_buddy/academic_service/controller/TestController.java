package com.campus_buddy.academic_service.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Test Controller to verify JWT authentication works
 */
@RestController
@RequestMapping("/test")
public class TestController {

    /**
     * Test endpoint to verify JWT token validation
     * Returns authenticated user's email and authorities
     */
    @GetMapping
    public Map<String, Object> test() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        Map<String, Object> response = new HashMap<>();
        response.put("email", authentication.getName());
        response.put("authorities", authentication.getAuthorities());
        response.put("message", "JWT Authentication Working! 🎉");
        
        return response;
    }
}
