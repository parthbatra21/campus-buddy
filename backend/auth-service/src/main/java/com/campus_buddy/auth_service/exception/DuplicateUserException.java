package com.campus_buddy.auth_service.exception;

/**
 * Exception thrown when attempting to register a user with duplicate email or studentId
 */
public class DuplicateUserException extends RuntimeException {
    
    public DuplicateUserException(String message) {
        super(message);
    }
}
