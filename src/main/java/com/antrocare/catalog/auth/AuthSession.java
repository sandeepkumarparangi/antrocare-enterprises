package com.antrocare.catalog.auth;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class AuthSession {

    @Id
    private String token;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String displayName;

    @Column(nullable = false)
    private String role;

    @Column(nullable = false)
    private boolean mainAdmin;

    @Column(nullable = false)
    private Instant expiresAt;

    protected AuthSession() {
    }

    public AuthSession(String token, String email, String displayName, String role, boolean mainAdmin, Instant expiresAt) {
        this.token = token;
        this.email = email;
        this.displayName = displayName;
        this.role = role;
        this.mainAdmin = mainAdmin;
        this.expiresAt = expiresAt;
    }

    public String getToken() {
        return token;
    }

    public String getEmail() {
        return email;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getRole() {
        return role;
    }

    public boolean isMainAdmin() {
        return mainAdmin;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public boolean isExpired() {
        return expiresAt.isBefore(Instant.now());
    }
}
