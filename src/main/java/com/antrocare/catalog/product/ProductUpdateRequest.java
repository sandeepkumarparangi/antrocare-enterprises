package com.antrocare.catalog.product;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;

public record ProductUpdateRequest(
    @NotBlank String cost,
    @NotBlank String status,
    @Min(0) int stockQuantity
) {
}
