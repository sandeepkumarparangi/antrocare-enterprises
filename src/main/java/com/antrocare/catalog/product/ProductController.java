package com.antrocare.catalog.product;

import java.util.Comparator;
import java.util.List;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class ProductController {

    private final ProductRepository productRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final String adminKey;

    public ProductController(
        ProductRepository productRepository,
        PurchaseRequestRepository purchaseRequestRepository,
        @Value("${antrocare.admin-key}") String adminKey
    ) {
        this.productRepository = productRepository;
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.adminKey = adminKey;
    }

    @GetMapping("/products")
    public ResponseEntity<List<Product>> products(
        @RequestParam(defaultValue = "false") boolean includeHidden,
        @RequestHeader(value = "X-Admin-Key", required = false) String providedAdminKey
    ) {
        if (includeHidden && !isAdmin(providedAdminKey)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<Product> products = includeHidden
            ? productRepository.findAll()
            : productRepository.findByStatusOrderByCategoryAscNameAsc("Active");

        List<Product> sortedProducts = products.stream()
            .sorted(Comparator.comparing(Product::getCategory).thenComparing(Product::getName))
            .toList();

        return ResponseEntity.ok(sortedProducts);
    }

    @GetMapping("/categories")
    public List<String> categories() {
        return productRepository.findAll().stream()
            .map(Product::getCategory)
            .distinct()
            .sorted()
            .toList();
    }

    @GetMapping("/summary")
    public DashboardSummary summary() {
        List<Product> products = productRepository.findAll();
        long active = products.stream().filter(product -> "Active".equals(product.getStatus())).count();
        long priced = products.stream().filter(product -> !"Price on request".equals(product.getCost())).count();
        long categories = products.stream().map(Product::getCategory).distinct().count();
        long purchaseRequests = purchaseRequestRepository.count();
        return new DashboardSummary(products.size(), active, priced, categories, purchaseRequests);
    }

    @PostMapping("/purchase-requests")
    public ResponseEntity<PurchaseRequest> createPurchaseRequest(@Valid @RequestBody ProductPurchaseRequest request) {
        return productRepository.findById(request.productId().trim())
            .filter(product -> "Active".equals(product.getStatus()))
            .map(product -> ResponseEntity.status(HttpStatus.CREATED).body(
                purchaseRequestRepository.save(new PurchaseRequest(product, request))
            ))
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/purchase-requests")
    public ResponseEntity<List<PurchaseRequest>> purchaseRequests(
        @RequestHeader(value = "X-Admin-Key", required = false) String providedAdminKey
    ) {
        if (!isAdmin(providedAdminKey)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(purchaseRequestRepository.findAllByOrderByCreatedAtDesc());
    }

    @PatchMapping("/products/{id}")
    public ResponseEntity<Product> updateProduct(
        @PathVariable String id,
        @Valid @RequestBody ProductUpdateRequest request,
        @RequestHeader(value = "X-Admin-Key", required = false) String providedAdminKey
    ) {
        if (!isAdmin(providedAdminKey)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return productRepository.findById(id)
            .map(product -> {
                product.update(request.cost().trim(), request.status().trim());
                return ResponseEntity.ok(productRepository.save(product));
            })
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private boolean isAdmin(String providedAdminKey) {
        return adminKey.equals(providedAdminKey);
    }
}
