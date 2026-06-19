package com.antrocare.catalog.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class LoginAttemptService {

    private final Map<String, AttemptWindow> attempts = new ConcurrentHashMap<>();
    private final int maxAttempts;
    private final Duration lockDuration;

    public LoginAttemptService(
        @Value("${antrocare.login.max-attempts:5}") int maxAttempts,
        @Value("${antrocare.login.lock-minutes:15}") long lockMinutes
    ) {
        this.maxAttempts = Math.max(1, maxAttempts);
        this.lockDuration = Duration.ofMinutes(Math.max(1, lockMinutes));
    }

    public void assertAllowed(String key) {
        AttemptWindow window = attempts.get(key);
        if (window == null) {
            return;
        }

        if (window.lockedUntil != null && window.lockedUntil.isAfter(Instant.now())) {
            throw new SecurityException("Too many failed login attempts.");
        }

        if (window.lockedUntil != null) {
            attempts.remove(key);
        }
    }

    public void recordSuccess(String key) {
        attempts.remove(key);
    }

    public void recordFailure(String key) {
        attempts.compute(key, (ignored, current) -> {
            AttemptWindow window = current == null ? new AttemptWindow() : current;
            window.failures += 1;
            window.lastFailure = Instant.now();
            if (window.failures >= maxAttempts) {
                window.lockedUntil = Instant.now().plus(lockDuration);
            }
            return window;
        });
    }

    private static class AttemptWindow {
        private int failures;
        private Instant lastFailure;
        private Instant lockedUntil;
    }
}
