package com.campus_buddy.auth_service.service;

import com.campus_buddy.auth_service.dto.AuthResponse;
import com.campus_buddy.auth_service.dto.LoginRequest;
import com.campus_buddy.auth_service.dto.RegisterRequest;
import com.campus_buddy.auth_service.dto.UserResponse;
import com.campus_buddy.auth_service.exception.DuplicateUserException;
import com.campus_buddy.auth_service.exception.UserNotFoundException;
import com.campus_buddy.auth_service.model.User;
import com.campus_buddy.auth_service.repository.UserRepository;
import com.campus_buddy.auth_service.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementation of AuthService
 * Handles user registration, login, and profile operations
 */
@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    /**
     * Register new user with password hashing and JWT generation
     */
    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check for duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateUserException("Email already registered: " + request.getEmail());
        }

        // Check for duplicate student ID
        if (userRepository.existsByStudentId(request.getStudentId())) {
            throw new DuplicateUserException("Student ID already registered: " + request.getStudentId());
        }

        // Create new user with hashed password
        User user = new User();
        user.setStudentId(request.getStudentId());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword())); // BCrypt hashing
        user.setRole(request.getRole());

        // Save user to database
        User savedUser = userRepository.save(user);

        // Generate JWT token
        String token = jwtService.generateToken(savedUser);

        // Return response with token
        return new AuthResponse(token, savedUser.getRole(), savedUser.getEmail());
    }

    /**
     * Authenticate user and generate JWT token
     */
    @Override
    public AuthResponse login(LoginRequest request) {
        // Find user by email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        // Generate JWT token
        String token = jwtService.generateToken(user);

        // Return response with token
        return new AuthResponse(token, user.getRole(), user.getEmail());
    }

    /**
     * Get current user information (for /auth/me endpoint)
     */
    @Override
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + email));

        // Map to UserResponse (excludes password)
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setStudentId(user.getStudentId());
        response.setEmail(user.getEmail());
        response.setUsername(user.getUsername());
        response.setRole(user.getRole());
        response.setCreatedAt(user.getCreatedAt());

        return response;
    }

    /**
     * Change password for logged-in user
     */
    @Override
    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + email));

        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid current password");
        }

        // Update password
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
