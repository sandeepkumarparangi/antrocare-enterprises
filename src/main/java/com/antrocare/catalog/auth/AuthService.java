package com.antrocare.catalog.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private static final int HASH_ITERATIONS = 120_000;
    private static final int HASH_BYTES = 32;
    private static final Duration SESSION_DURATION = Duration.ofDays(7);

    private final SecureRandom secureRandom = new SecureRandom();
    private final UserAccountRepository userAccountRepository;
    private final AuthSessionRepository authSessionRepository;
    private final String adminKey;

    public AuthService(
        UserAccountRepository userAccountRepository,
        AuthSessionRepository authSessionRepository,
        @Value("${antrocare.admin-key}") String adminKey
    ) {
        this.userAccountRepository = userAccountRepository;
        this.authSessionRepository = authSessionRepository;
        this.adminKey = adminKey;
    }

    public AuthSession signup(String name, String email, String password) {
        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail.isBlank() || userAccountRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email is already registered.");
        }

        String displayName = name == null || name.isBlank() ? normalizedEmail : name.trim();
        UserAccount user = userAccountRepository.save(new UserAccount(displayName, normalizedEmail, hashPassword(password)));
        return createSession(user.getEmail(), user.getName(), user.getRole());
    }

    public AuthSession loginUser(String email, String password) {
        String normalizedEmail = normalizeEmail(email);
        UserAccount user = userAccountRepository.findByEmail(normalizedEmail)
            .filter(account -> verifyPassword(password, account.getPasswordHash()))
            .orElseThrow(() -> new IllegalArgumentException("Invalid user login."));
        return createSession(user.getEmail(), user.getName(), user.getRole());
    }

    public AuthSession loginAdmin(String email, String password) {
        String normalizedEmail = normalizeEmail(email);
        if (!normalizedEmail.isBlank()) {
            UserAccount admin = userAccountRepository.findByEmail(normalizedEmail)
                .filter(account -> "ADMIN".equals(account.getRole()))
                .filter(account -> verifyPassword(password, account.getPasswordHash()))
                .orElseThrow(() -> new IllegalArgumentException("Invalid admin login."));
            return createSession(admin.getEmail(), admin.getName(), admin.getRole(), false);
        }

        if (!constantTimeEquals(adminKey, password == null ? "" : password.trim())) {
            throw new IllegalArgumentException("Invalid admin login.");
        }
        return createSession("main-admin@antrocare.local", "Main Admin", "MAIN_ADMIN", true);
    }

    public UserAccount registerAdmin(String authToken, String name, String email, String phone, String password) {
        if (!isMainAdmin(authToken)) {
            throw new SecurityException("Main admin session is required.");
        }

        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail.isBlank() || userAccountRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email is already registered.");
        }
        String normalizedPhone = normalizePhone(phone);
        if (normalizedPhone.isBlank()) {
            throw new IllegalArgumentException("Phone number is required.");
        }

        String displayName = name == null || name.isBlank() ? normalizedEmail : name.trim();
        return userAccountRepository.save(new UserAccount(displayName, normalizedEmail, normalizedPhone, hashPassword(password), "ADMIN"));
    }

    public List<UserAccount> listAdmins(String authToken) {
        if (!isMainAdmin(authToken)) {
            throw new SecurityException("Main admin session is required.");
        }
        return userAccountRepository.findByRoleOrderByCreatedAtDesc("ADMIN");
    }

    @Transactional
    public void deleteAdmin(String authToken, Long adminId) {
        if (!isMainAdmin(authToken)) {
            throw new SecurityException("Main admin session is required.");
        }

        UserAccount admin = userAccountRepository.findById(adminId)
            .filter(account -> "ADMIN".equals(account.getRole()))
            .orElseThrow(() -> new IllegalArgumentException("Admin account was not found."));

        authSessionRepository.deleteByEmail(admin.getEmail());
        userAccountRepository.delete(admin);
    }

    public Optional<AuthSession> findValidSession(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        return authSessionRepository.findById(token.trim()).filter(session -> !session.isExpired());
    }

    public boolean isAdmin(String legacyAdminKey, String authToken) {
        if (constantTimeEquals(adminKey, legacyAdminKey == null ? "" : legacyAdminKey.trim())) {
            return true;
        }

        return findValidSession(authToken)
            .map(session -> "ADMIN".equals(session.getRole()) || "MAIN_ADMIN".equals(session.getRole()))
            .filter(Boolean::booleanValue)
            .isPresent();
    }

    public boolean isMainAdmin(String authToken) {
        return findValidSession(authToken)
            .filter(AuthSession::isMainAdmin)
            .isPresent();
    }

    private AuthSession createSession(String email, String displayName, String role) {
        return createSession(email, displayName, role, false);
    }

    private AuthSession createSession(String email, String displayName, String role, boolean mainAdmin) {
        AuthSession session = new AuthSession(newToken(), email, displayName, role, mainAdmin, Instant.now().plus(SESSION_DURATION));
        return authSessionRepository.save(session);
    }

    private String newToken() {
        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        return HexFormat.of().formatHex(tokenBytes);
    }

    private String hashPassword(String password) {
        try {
            byte[] salt = new byte[16];
            secureRandom.nextBytes(salt);
            byte[] hash = pbkdf2(password, salt);
            return HASH_ITERATIONS + ":" + Base64.getEncoder().encodeToString(salt) + ":" + Base64.getEncoder().encodeToString(hash);
        } catch (Exception error) {
            throw new IllegalStateException("Could not hash password.", error);
        }
    }

    private boolean verifyPassword(String password, String storedHash) {
        try {
            String[] parts = storedHash.split(":");
            if (parts.length != 3) {
                return false;
            }
            byte[] salt = Base64.getDecoder().decode(parts[1]);
            byte[] expected = Base64.getDecoder().decode(parts[2]);
            byte[] actual = pbkdf2(password, salt);
            return MessageDigest.isEqual(expected, actual);
        } catch (Exception error) {
            return false;
        }
    }

    private byte[] pbkdf2(String password, byte[] salt) throws Exception {
        PBEKeySpec spec = new PBEKeySpec((password == null ? "" : password).toCharArray(), salt, HASH_ITERATIONS, HASH_BYTES * 8);
        return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private String normalizePhone(String phone) {
        return phone == null ? "" : phone.trim();
    }

    private boolean constantTimeEquals(String left, String right) {
        return MessageDigest.isEqual(
            left.getBytes(StandardCharsets.UTF_8),
            right.getBytes(StandardCharsets.UTF_8)
        );
    }
}
