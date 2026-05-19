package com.antrocare.catalog.product;

import jakarta.validation.constraints.NotBlank;

public record ProductUpdateRequest(
    @NotBlank String cost,
    @NotBlank String status
) {
}
