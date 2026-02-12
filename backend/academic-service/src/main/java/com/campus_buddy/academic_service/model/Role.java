package com.campus_buddy.academic_service.model;

/**
 * Role enum - MUST MATCH Auth Service
 * Shared for consistent access control across microservices
 */
public enum Role {
    STUDENT,
    FACULTY,
    ADMIN
}
