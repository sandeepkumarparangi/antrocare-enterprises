package com.antrocare.catalog.auth;

import jakarta.validation.constraints.NotBlank;

public record AuthRequest(
    String name,
    String email,
    @NotBlank String password
) {
}
