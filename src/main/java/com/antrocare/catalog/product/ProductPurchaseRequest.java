package com.antrocare.catalog.product;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProductPurchaseRequest(
    @NotBlank String productId,
    @NotBlank String buyerName,
    @NotBlank String buyerPhone,
    @Email String buyerEmail,
    @Min(1) @Max(99) int quantity,
    @NotBlank @Size(max = 80) String selectedSize,
    @Size(max = 500) String notes,
    @Size(max = 255) String prescriptionFileName,
    @Size(max = 500) String prescriptionUrl
) {
}
