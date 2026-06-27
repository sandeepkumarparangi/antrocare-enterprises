package com.antrocare.catalog.exception;

/**
 * Exception thrown when authentication fails.
 */
public class AuthenticationException extends AntrocareException {
    public AuthenticationException(String message) {
        super(message, 401);
    }

    public AuthenticationException(String message, Throwable cause) {
        super(message, cause, 401);
    }
}