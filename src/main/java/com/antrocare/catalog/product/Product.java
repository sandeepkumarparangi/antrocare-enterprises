package com.antrocare.catalog.product;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotBlank;

@Entity
public class Product {

    private static final int LOW_STOCK_THRESHOLD = 5;

    @Id
    private String id;

    @NotBlank
    private String name;

    @NotBlank
    private String category;

    @NotBlank
    private String cost;

    @NotBlank
    private String status;

    private int stockQuantity = 50;

    private int unitsSold;

    private boolean lowStockAlertSent;

    @Column(length = 220)
    private String useDescription;

    private int brochurePage;

    @Column(length = 500)
    private String imageUrl;

    @Column(length = 500)
    private String brochureUrl;

    protected Product() {
    }

    public Product(String id, String name, String category, String cost, String status, String useDescription, int brochurePage, String imageUrl, String brochureUrl) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.cost = cost;
        this.status = status;
        this.stockQuantity = 50;
        this.unitsSold = 0;
        this.lowStockAlertSent = false;
        this.useDescription = useDescription;
        this.brochurePage = brochurePage;
        this.imageUrl = imageUrl;
        this.brochureUrl = brochureUrl;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getCategory() {
        return category;
    }

    public String getCost() {
        return cost;
    }

    public String getStatus() {
        return status;
    }

    public int getStockQuantity() {
        return stockQuantity;
    }

    public int getUnitsSold() {
        return unitsSold;
    }

    public boolean isLowStockAlertSent() {
        return lowStockAlertSent;
    }

    public String getUseDescription() {
        return useDescription;
    }

    public int getBrochurePage() {
        return brochurePage;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public String getBrochureUrl() {
        return brochureUrl;
    }

    public void update(String cost, String status, int stockQuantity) {
        this.cost = cost;
        this.stockQuantity = Math.max(0, stockQuantity);
        this.status = this.stockQuantity == 0 ? "Hidden" : status;
        if (this.stockQuantity >= LOW_STOCK_THRESHOLD) {
            this.lowStockAlertSent = false;
        }
    }

    public void recordSale(int quantity) {
        int saleQuantity = Math.max(1, quantity);
        if (saleQuantity > stockQuantity) {
            throw new IllegalArgumentException("Requested quantity is greater than available stock.");
        }
        this.stockQuantity -= saleQuantity;
        this.unitsSold += saleQuantity;
        if (this.stockQuantity == 0) {
            this.status = "Hidden";
        }
    }

    public void resetForExistingCatalog(String defaultCost, int defaultStock) {
        if ("Price on request".equals(cost)) {
            this.cost = defaultCost;
        }
        if (stockQuantity <= 0 && unitsSold == 0) {
            this.stockQuantity = defaultStock;
            if ("Hidden".equals(status)) {
                this.status = "Active";
            }
        }
        if (stockQuantity >= LOW_STOCK_THRESHOLD) {
            this.lowStockAlertSent = false;
        }
    }

    public boolean isLowStock(int threshold) {
        return stockQuantity > 0 && stockQuantity < threshold;
    }

    public void markLowStockAlertSent() {
        this.lowStockAlertSent = true;
    }
}
