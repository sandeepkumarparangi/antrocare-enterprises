package com.antrocare.catalog.product;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.transaction.Transactional;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
import org.springframework.web.multipart.MultipartFile;

import com.antrocare.catalog.auth.AuthSession;
import com.antrocare.catalog.auth.AuthService;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class ProductController {

    private static final Path PRESCRIPTION_UPLOAD_DIR = Path.of("uploads", "prescriptions");
    private static final Set<String> PURCHASE_REQUEST_STATUSES = Set.of("New", "Reviewed", "Contacted", "Completed");

    private final ProductRepository productRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final ProductChangeRequestRepository productChangeRequestRepository;
    private final LowStockAlertService lowStockAlertService;
    private final AdminApprovalNotificationService adminApprovalNotificationService;
    private final AuthService authService;

    public ProductController(
        ProductRepository productRepository,
        PurchaseRequestRepository purchaseRequestRepository,
        ProductChangeRequestRepository productChangeRequestRepository,
        LowStockAlertService lowStockAlertService,
        AdminApprovalNotificationService adminApprovalNotificationService,
        AuthService authService
    ) {
        this.productRepository = productRepository;
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.productChangeRequestRepository = productChangeRequestRepository;
        this.lowStockAlertService = lowStockAlertService;
        this.adminApprovalNotificationService = adminApprovalNotificationService;
        this.authService = authService;
    }

    @GetMapping("/products")
    public ResponseEntity<List<Product>> products(
        @RequestParam(defaultValue = "false") boolean includeHidden,
        @RequestHeader(value = "X-Admin-Key", required = false) String providedAdminKey,
        @RequestHeader(value = "X-Auth-Token", required = false) String authToken
    ) {
        if (includeHidden && !isAdmin(providedAdminKey, authToken)) {
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
        long totalUnitsSold = products.stream().mapToLong(Product::getUnitsSold).sum();
        long lowStockProducts = products.stream().filter(product -> product.isLowStock(lowStockAlertService.threshold())).count();
        return new DashboardSummary(products.size(), active, priced, categories, purchaseRequests, totalUnitsSold, lowStockProducts);
    }

    @GetMapping("/stock-alerts")
    public ResponseEntity<List<Product>> stockAlerts(
        @RequestHeader(value = "X-Admin-Key", required = false) String providedAdminKey,
        @RequestHeader(value = "X-Auth-Token", required = false) String authToken
    ) {
        if (!isAdmin(providedAdminKey, authToken)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(productRepository.findByStockQuantityGreaterThanAndStockQuantityLessThanOrderByStockQuantityAscNameAsc(0, lowStockAlertService.threshold()));
    }

    @PostMapping("/notifications/test-email")
    public ResponseEntity<Void> sendTestEmail(
        @RequestBody(required = false) Map<String, String> request,
        @RequestHeader(value = "X-Admin-Key", required = false) String providedAdminKey,
        @RequestHeader(value = "X-Auth-Token", required = false) String authToken
    ) {
        if (!isAdmin(providedAdminKey, authToken)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String recipientEmail = request == null ? null : request.get("email");
        boolean sent = adminApprovalNotificationService.sendTestEmail(recipientEmail);
        return sent ? ResponseEntity.noContent().build() : ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
    }

    @PostMapping("/purchase-requests")
    @Transactional
    public ResponseEntity<PurchaseRequest> createPurchaseRequest(
        @Valid @RequestBody ProductPurchaseRequest request,
        @RequestHeader(value = "X-Auth-Token", required = false) String authToken
    ) {
        AuthSession session = authService.findValidSession(authToken).orElse(null);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return productRepository.findById(request.productId().trim())
            .filter(product -> "Active".equals(product.getStatus()))
            .map(product -> {
                if (request.quantity() > product.getStockQuantity()) {
                    return ResponseEntity.status(HttpStatus.CONFLICT).<PurchaseRequest>build();
                }

                PurchaseRequest saved = purchaseRequestRepository.save(new PurchaseRequest(product, request));
                product.recordSale(request.quantity());
                if (lowStockAlertService.notifyIfNeeded(product)) {
                    product.markLowStockAlertSent();
                }
                productRepository.save(product);
                return ResponseEntity.status(HttpStatus.CREATED).body(saved);
            })
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping(value = "/prescriptions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadPrescription(
        @RequestParam("file") MultipartFile file,
        @RequestHeader(value = "X-Auth-Token", required = false) String authToken
    ) {
        AuthSession session = authService.findValidSession(authToken).orElse(null);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        String originalName = file.getOriginalFilename() == null ? "prescription" : Path.of(file.getOriginalFilename()).getFileName().toString();
        String safeName = originalName.replaceAll("[^A-Za-z0-9._-]", "_");
        String storedName = UUID.randomUUID() + "-" + safeName;

        try {
            Files.createDirectories(PRESCRIPTION_UPLOAD_DIR);
            file.transferTo(PRESCRIPTION_UPLOAD_DIR.resolve(storedName));
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "fileName", originalName,
                "url", "/api/prescriptions/" + storedName
            ));
        } catch (IOException error) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/prescriptions/{fileName}")
    public ResponseEntity<Resource> prescription(
        @PathVariable String fileName,
        @RequestHeader(value = "X-Admin-Key", required = false) String providedAdminKey,
        @RequestHeader(value = "X-Auth-Token", required = false) String authToken
    ) {
        if (!isAdmin(providedAdminKey, authToken) && authService.findValidSession(authToken).isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        try {
            Path file = PRESCRIPTION_UPLOAD_DIR.resolve(Path.of(fileName).getFileName()).normalize();
            if (!file.startsWith(PRESCRIPTION_UPLOAD_DIR) || !Files.exists(file)) {
                return ResponseEntity.notFound().build();
            }
            Resource resource = new UrlResource(file.toUri());
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFileName() + "\"")
                .body(resource);
        } catch (MalformedURLException error) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/purchase-requests")
    public ResponseEntity<List<PurchaseRequest>> purchaseRequests(
        @RequestHeader(value = "X-Admin-Key", required = false) String providedAdminKey,
        @RequestHeader(value = "X-Auth-Token", required = false) String authToken
    ) {
        if (!isAdmin(providedAdminKey, authToken)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(purchaseRequestRepository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/purchase-requests/me")
    public ResponseEntity<List<PurchaseRequest>> myPurchaseRequests(
        @RequestHeader(value = "X-Auth-Token", required = false) String authToken
    ) {
        AuthSession session = authService.findValidSession(authToken).orElse(null);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(purchaseRequestRepository.findByBuyerEmailIgnoreCaseOrderByCreatedAtDesc(session.getEmail()));
    }

    @PatchMapping("/purchase-requests/{id}/status")
    @Transactional
    public ResponseEntity<PurchaseRequest> updatePurchaseRequestStatus(
        @PathVariable Long id,
        @RequestBody Map<String, String> request,
        @RequestHeader(value = "X-Admin-Key", required = false) String providedAdminKey,
        @RequestHeader(value = "X-Auth-Token", required = false) String authToken
    ) {
        if (!isAdmin(providedAdminKey, authToken)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String status = request == null ? "" : request.getOrDefault("status", "").trim();
        if (!PURCHASE_REQUEST_STATUSES.contains(status)) {
            return ResponseEntity.badRequest().build();
        }

        return purchaseRequestRepository.findById(id)
            .map(purchaseRequest -> {
                purchaseRequest.updateStatus(status);
                return ResponseEntity.ok(purchaseRequestRepository.save(purchaseRequest));
            })
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/products/{id}")
    @Transactional
    public ResponseEntity<Product> updateProduct(
        @PathVariable String id,
        @Valid @RequestBody ProductUpdateRequest request,
        @RequestHeader(value = "X-Admin-Key", required = false) String providedAdminKey,
        @RequestHeader(value = "X-Auth-Token", required = false) String authToken
    ) {
        if (!isAdmin(providedAdminKey, authToken)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        AuthSession session = authService.findValidSession(authToken).orElse(null);
        boolean mainAdmin = authService.isLegacyMainAdminKey(providedAdminKey) || (session != null && session.isMainAdmin());

        return productRepository.findById(id)
            .map(product -> {
                if (!hasProductChanges(product, request)) {
                    return ResponseEntity.ok(product);
                }

                if (!mainAdmin) {
                    String requestedByEmail = session == null ? "admin@antrocare.local" : session.getEmail();
                    String requestedByName = session == null ? "Admin" : session.getDisplayName();
                    productChangeRequestRepository.save(new ProductChangeRequest(product, request, requestedByEmail, requestedByName));
                    return ResponseEntity.status(HttpStatus.ACCEPTED).body(product);
                }

                applyProductUpdate(product, request);
                return ResponseEntity.ok(productRepository.save(product));
            })
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/product-change-requests")
    public ResponseEntity<List<ProductChangeRequest>> productChangeRequests(
        @RequestHeader(value = "X-Auth-Token", required = false) String authToken
    ) {
        if (!authService.isMainAdmin(authToken)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(productChangeRequestRepository.findByStatusOrderByCreatedAtDesc("PENDING"));
    }

    @PostMapping("/product-change-requests/{id}/approve")
    @Transactional
    public ResponseEntity<ProductChangeRequest> approveProductChange(
        @PathVariable Long id,
        @RequestHeader(value = "X-Auth-Token", required = false) String authToken
    ) {
        AuthSession session = authService.findValidSession(authToken).filter(AuthSession::isMainAdmin).orElse(null);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return productChangeRequestRepository.findById(id)
            .filter(change -> "PENDING".equals(change.getStatus()))
            .flatMap(change -> productRepository.findById(change.getProductId()).map(product -> {
                applyProductUpdate(product, new ProductUpdateRequest(change.getRequestedCost(), change.getRequestedStatus(), change.getRequestedStockQuantity()));
                productRepository.save(product);
                change.approve(session.getEmail());
                ProductChangeRequest savedChange = productChangeRequestRepository.save(change);
                adminApprovalNotificationService.notifyApproved(savedChange);
                return ResponseEntity.ok(savedChange);
            }))
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/product-change-requests/{id}/reject")
    @Transactional
    public ResponseEntity<ProductChangeRequest> rejectProductChange(
        @PathVariable Long id,
        @RequestHeader(value = "X-Auth-Token", required = false) String authToken
    ) {
        AuthSession session = authService.findValidSession(authToken).filter(AuthSession::isMainAdmin).orElse(null);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return productChangeRequestRepository.findById(id)
            .filter(change -> "PENDING".equals(change.getStatus()))
            .map(change -> {
                change.reject(session.getEmail());
                ProductChangeRequest savedChange = productChangeRequestRepository.save(change);
                adminApprovalNotificationService.notifyRejected(savedChange);
                return ResponseEntity.ok(savedChange);
            })
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private void applyProductUpdate(Product product, ProductUpdateRequest request) {
        product.update(request.cost().trim(), request.status().trim(), request.stockQuantity());
        if (lowStockAlertService.notifyIfNeeded(product)) {
            product.markLowStockAlertSent();
        }
    }

    private boolean hasProductChanges(Product product, ProductUpdateRequest request) {
        return !product.getCost().equals(request.cost().trim())
            || !product.getStatus().equals(request.status().trim())
            || product.getStockQuantity() != request.stockQuantity();
    }

    private boolean isAdmin(String providedAdminKey, String authToken) {
        return authService.isAdmin(providedAdminKey, authToken);
    }
}
