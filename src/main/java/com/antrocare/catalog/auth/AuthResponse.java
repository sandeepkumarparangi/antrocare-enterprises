package com.antrocare.catalog.auth;

import java.time.Instant;

public record AuthResponse(
    String token,
    String role,
    String email,
    String displayName,
    boolean mainAdmin,
    Instant expiresAt
) {
    public static AuthResponse from(AuthSession session) {
        return new AuthResponse(
            session.getToken(),
            session.getRole(),
            session.getEmail(),
            session.getDisplayName(),
            session.isMainAdmin(),
            session.getExpiresAt()
        );
    }
}
