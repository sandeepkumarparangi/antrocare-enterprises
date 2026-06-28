package com.antrocare.catalog.auth;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    private final AuthService authService;
    private final LoginAttemptService loginAttemptService;

    public AuthController(AuthService authService, LoginAttemptService loginAttemptService) {
        this.authService = authService;
        this.loginAttemptService = loginAttemptService;
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody AuthRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(AuthResponse.from(authService.signup(request.name(), request.email(), request.password())));
        } catch (IllegalArgumentException error) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        String attemptKey = "user:" + normalizeAttemptEmail(request.email());
        try {
            loginAttemptService.assertAllowed(attemptKey);
            AuthResponse response = AuthResponse.from(authService.loginUser(request.email(), request.password()));
            loginAttemptService.recordSuccess(attemptKey);
            return ResponseEntity.ok(response);
        } catch (SecurityException error) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        } catch (IllegalArgumentException error) {
            loginAttemptService.recordFailure(attemptKey);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/admin/login")
    public ResponseEntity<AuthResponse> adminLogin(@Valid @RequestBody AuthRequest request) {
        String attemptKey = "admin:" + normalizeAttemptEmail(request.email());
        try {
            loginAttemptService.assertAllowed(attemptKey);
            AuthResponse response = AuthResponse.from(authService.loginAdmin(request.email(), request.password()));
            loginAttemptService.recordSuccess(attemptKey);
            return ResponseEntity.ok(response);
        } catch (SecurityException error) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        } catch (IllegalArgumentException error) {
            loginAttemptService.recordFailure(attemptKey);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/admin/register")
    public ResponseEntity<AdminAccountResponse> registerAdmin(
        @RequestHeader(value = "X-Auth-Token", required = false) String authToken,
        @Valid @RequestBody AuthRequest request
    ) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(AdminAccountResponse.from(authService.registerAdmin(authToken, request.name(), request.email(), request.phone(), request.password())));
        } catch (SecurityException error) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (IllegalArgumentException error) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
    }

    @GetMapping("/admin/accounts")
    public ResponseEntity<List<AdminAccountResponse>> adminAccounts(
        @RequestHeader(value = "X-Auth-Token", required = false) String authToken
    ) {
        try {
            return ResponseEntity.ok(authService.listAdmins(authToken).stream().map(AdminAccountResponse::from).toList());
        } catch (SecurityException error) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @DeleteMapping("/admin/accounts/{adminId}")
    public ResponseEntity<Void> deleteAdmin(
        @RequestHeader(value = "X-Auth-Token", required = false) String authToken,
        @PathVariable Long adminId
    ) {
        try {
            authService.deleteAdmin(authToken, adminId);
            return ResponseEntity.noContent().build();
        } catch (SecurityException error) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (IllegalArgumentException error) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> me(@RequestHeader(value = "X-Auth-Token", required = false) String authToken) {
        return authService.findValidSession(authToken)
            .map(session -> ResponseEntity.ok(AuthResponse.from(session)))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader(value = "X-Auth-Token", required = false) String authToken) {
        authService.logout(authToken);
        return ResponseEntity.noContent().build();
    }

    private String normalizeAttemptEmail(String email) {
        String normalized = email == null ? "" : email.trim().toLowerCase();
        return normalized.isBlank() ? "main-admin" : normalized;
    }
}
