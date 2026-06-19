package com.antrocare.catalog.product;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class ProductChangeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String productId;

    @Column(nullable = false)
    private String productName;

    @Column(nullable = false)
    private String productCategory;

    @Column(nullable = false)
    private String currentCost;

    @Column(nullable = false)
    private String requestedCost;

    @Column(nullable = false)
    private String currentStatus;

    @Column(nullable = false)
    private String requestedStatus;

    private int currentStockQuantity;

    private int requestedStockQuantity;

    @Column(nullable = false)
    private String requestedByEmail;

    @Column(nullable = false)
    private String requestedByName;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant reviewedAt;

    private String reviewedByEmail;

    protected ProductChangeRequest() {
    }

    public ProductChangeRequest(Product product, ProductUpdateRequest request, String requestedByEmail, String requestedByName) {
        this.productId = product.getId();
        this.productName = product.getName();
        this.productCategory = product.getCategory();
        this.currentCost = product.getCost();
        this.requestedCost = request.cost().trim();
        this.currentStatus = product.getStatus();
        this.requestedStatus = request.status().trim();
        this.currentStockQuantity = product.getStockQuantity();
        this.requestedStockQuantity = request.stockQuantity();
        this.requestedByEmail = requestedByEmail;
        this.requestedByName = requestedByName;
        this.status = "PENDING";
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getProductId() {
        return productId;
    }

    public String getProductName() {
        return productName;
    }

    public String getProductCategory() {
        return productCategory;
    }

    public String getCurrentCost() {
        return currentCost;
    }

    public String getRequestedCost() {
        return requestedCost;
    }

    public String getCurrentStatus() {
        return currentStatus;
    }

    public String getRequestedStatus() {
        return requestedStatus;
    }

    public int getCurrentStockQuantity() {
        return currentStockQuantity;
    }

    public int getRequestedStockQuantity() {
        return requestedStockQuantity;
    }

    public String getRequestedByEmail() {
        return requestedByEmail;
    }

    public String getRequestedByName() {
        return requestedByName;
    }

    public String getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public String getReviewedByEmail() {
        return reviewedByEmail;
    }

    public void approve(String reviewedByEmail) {
        this.status = "APPROVED";
        this.reviewedByEmail = reviewedByEmail;
        this.reviewedAt = Instant.now();
    }

    public void reject(String reviewedByEmail) {
        this.status = "REJECTED";
        this.reviewedByEmail = reviewedByEmail;
        this.reviewedAt = Instant.now();
    }
}
