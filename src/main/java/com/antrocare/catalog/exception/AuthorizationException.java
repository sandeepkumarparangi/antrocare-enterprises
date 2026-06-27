package com.antrocare.catalog.exception;

/**
 * Exception thrown when authorization fails (access denied).
 */
public class AuthorizationException extends AntrocareException {
    public AuthorizationException(String message) {
        super(message, 403);
    }

    public AuthorizationException(String message, Throwable cause) {
        super(message, cause, 403);
    }
}