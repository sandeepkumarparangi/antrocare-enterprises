package com.antrocare.catalog.product;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "purchase_requests")
public class PurchaseRequest {

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
    private String costSnapshot;

    @Column(nullable = false)
    private String buyerName;

    @Column(nullable = false)
    private String buyerPhone;

    private String buyerEmail;

    private int quantity;

    @Column(length = 500)
    private String notes;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private Instant createdAt;

    protected PurchaseRequest() {
    }

    public PurchaseRequest(Product product, ProductPurchaseRequest request) {
        this.productId = product.getId();
        this.productName = product.getName();
        this.productCategory = product.getCategory();
        this.costSnapshot = product.getCost();
        this.buyerName = request.buyerName().trim();
        this.buyerPhone = request.buyerPhone().trim();
        this.buyerEmail = normalizeOptional(request.buyerEmail());
        this.quantity = request.quantity();
        this.notes = normalizeOptional(request.notes());
        this.status = "New";
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

    public String getCostSnapshot() {
        return costSnapshot;
    }

    public String getBuyerName() {
        return buyerName;
    }

    public String getBuyerPhone() {
        return buyerPhone;
    }

    public String getBuyerEmail() {
        return buyerEmail;
    }

    public int getQuantity() {
        return quantity;
    }

    public String getNotes() {
        return notes;
    }

    public String getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    private static String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.trim();
    }
}
