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
        @Value("${antrocare.oauth2.enabled:false}") boolean enabled,
        @Value("${antrocare.oauth2.providers:google}") String providers
    ) {
        this.enabled = enabled;
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
}
