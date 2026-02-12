package com.campus_buddy.campus_service.model;

/**
 * Role enum - MUST MATCH Auth Service
 * Shared for consistent access control across microservices
 */
public enum Role {
    STUDENT,
    FACULTY,
    ADMIN
}
