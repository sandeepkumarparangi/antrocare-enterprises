package com.antrocare.catalog.exception;

/**
 * Base custom exception for Antrocare application.
 */
public class AntrocareException extends RuntimeException {
    private final int statusCode;

    public AntrocareException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public AntrocareException(String message, Throwable cause, int statusCode) {
        super(message, cause);
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }
}