package com.antrocare.catalog.exception;

/**
 * Exception thrown when invalid data is provided.
 */
public class InvalidDataException extends AntrocareException {
    public InvalidDataException(String message) {
        super(message, 400);
    }

    public InvalidDataException(String message, Throwable cause) {
        super(message, cause, 400);
    }
}

