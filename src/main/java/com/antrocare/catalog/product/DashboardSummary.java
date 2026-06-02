package com.antrocare.catalog.product;

public record DashboardSummary(
    long totalProducts,
    long activeProducts,
    long pricedProducts,
    long categories,
    long purchaseRequests,
    long totalUnitsSold,
    long lowStockProducts
) {
}
