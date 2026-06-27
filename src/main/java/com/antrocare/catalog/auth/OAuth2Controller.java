package com.antrocare.catalog.auth;

import java.util.Arrays;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/oauth2")
public class OAuth2Controller {

    private final boolean enabled;
    private final String providers;

    public OAuth2Controller(
        @Value("${antrocare.oauth2.enabled:}") String enabled,
        @Value("${spring.security.oauth2.client.registration.google.client-id:}") String googleClientId,
        @Value("${spring.security.oauth2.client.registration.google.client-secret:}") String googleClientSecret,
        @Value("${antrocare.oauth2.providers:google}") String providers
    ) {
        this.enabled = oauth2Enabled(enabled, googleClientId, googleClientSecret);
        this.providers = providers;
    }

    @GetMapping("/status")
    public OAuth2StatusResponse status() {
        return new OAuth2StatusResponse(
            enabled,
            Arrays.stream(providers.split(","))
                .map(String::trim)
                .filter(provider -> !provider.isBlank())
                .toList()
        );
    }

    private boolean oauth2Enabled(String configuredValue, String googleClientId, String googleClientSecret) {
        if (configuredValue != null && !configuredValue.isBlank()) {
            return Boolean.parseBoolean(configuredValue.trim());
        }
        return hasText(googleClientId) && hasText(googleClientSecret);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
