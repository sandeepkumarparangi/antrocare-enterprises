package com.antrocare.catalog.product;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductChangeRequestRepository extends JpaRepository<ProductChangeRequest, Long> {
    List<ProductChangeRequest> findByStatusOrderByCreatedAtDesc(String status);
}
