package com.antrocare.catalog.product;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotBlank;

@Entity
public class Product {

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

    public void update(String cost, String status) {
        this.cost = cost;
        this.status = status;
    }
}
