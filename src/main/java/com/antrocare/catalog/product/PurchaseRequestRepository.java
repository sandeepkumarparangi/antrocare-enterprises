package com.antrocare.catalog.product;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequest, Long> {
    List<PurchaseRequest> findAllByOrderByCreatedAtDesc();
}
