package com.antrocare.catalog.exception;

/**
 * Exception thrown when a resource is not found.
 */
public class ResourceNotFoundException extends AntrocareException {
    public ResourceNotFoundException(String message) {
        super(message, 404);
    }

    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause, 404);
    }
}