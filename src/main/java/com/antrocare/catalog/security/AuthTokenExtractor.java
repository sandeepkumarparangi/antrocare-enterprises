package com.antrocare.catalog.security;

import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;

/**
 * Utility class to extract Bearer tokens from Authorization headers.
 * Converts standard OAuth 2.0 "Authorization: Bearer <token>" format
 * to the token value used by the application.
 */
@Component
public class AuthTokenExtractor {

    /**
     * Extracts the token from Authorization header.
     * Expected format: "Authorization: Bearer <token>"
     * 
     * @param authorizationHeader The Authorization header value
     * @return The token value, or null if header is invalid
     */
    public static String extractToken(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            return null;
        }
        
        String header = authorizationHeader.trim();
        if (!header.startsWith("Bearer ")) {
            return null;
        }
        
        return header.substring(7).trim();
    }
}

