package com.antrocare.catalog.auth;

import java.time.Instant;

public record AdminAccountResponse(
    Long id,
    String name,
    String email,
    String phone,
    Instant createdAt
) {
    public static AdminAccountResponse from(UserAccount account) {
        return new AdminAccountResponse(
            account.getId(),
            account.getName(),
            account.getEmail(),
            account.getPhone(),
            account.getCreatedAt()
        );
    }
}
