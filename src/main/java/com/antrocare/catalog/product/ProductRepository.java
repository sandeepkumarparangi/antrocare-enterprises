package com.antrocare.catalog.product;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, String> {
    List<Product> findByStatusOrderByCategoryAscNameAsc(String status);
    List<Product> findByCategoryOrderByNameAsc(String category);
    List<Product> findByStockQuantityGreaterThanAndStockQuantityLessThanOrderByStockQuantityAscNameAsc(int minimumStock, int threshold);
}
