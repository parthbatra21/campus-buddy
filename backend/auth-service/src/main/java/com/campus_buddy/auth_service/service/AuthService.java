package com.campus_buddy.auth_service.service;

import com.campus_buddy.auth_service.dto.AuthResponse;
import com.campus_buddy.auth_service.dto.LoginRequest;
import com.campus_buddy.auth_service.dto.RegisterRequest;
import com.campus_buddy.auth_service.dto.UserResponse;

/**
 * Service interface for authentication operations
 */
public interface AuthService {
    
    /**
     * Register a new user and return JWT token
     */
    AuthResponse register(RegisterRequest request);
    
    /**
     * Authenticate user and return JWT token
     */
    AuthResponse login(LoginRequest request);
    
    /**
     * Get current user information from email (SecurityContext)
     */
    UserResponse getCurrentUser(String email);
}
