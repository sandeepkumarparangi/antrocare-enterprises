package com.antrocare.catalog.security;

import java.io.IOException;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import com.antrocare.catalog.auth.AuthService;
import com.antrocare.catalog.auth.AuthSession;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;
    private final String frontendUrl;

    public OAuth2LoginSuccessHandler(
        AuthService authService,
        @Value("${antrocare.frontend-url}") String frontendUrl
    ) {
        this.authService = authService;
        this.frontendUrl = frontendUrl;
    }

    @Override
    public void onAuthenticationSuccess(
        HttpServletRequest request,
        HttpServletResponse response,
        Authentication authentication
    ) throws IOException, ServletException {
        OAuth2User principal = (OAuth2User) authentication.getPrincipal();
        String email = stringAttribute(principal, "email");
        String name = firstPresent(
            stringAttribute(principal, "name"),
            stringAttribute(principal, "given_name"),
            email
        );

        if (email.isBlank()) {
            response.sendRedirect(UriComponentsBuilder.fromUriString(frontendUrl)
                .queryParam("oauthError", "email_required")
                .toUriString());
            return;
        }

        AuthSession session = authService.loginOAuthUser(name, email);
        String redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl)
            .queryParam("oauthToken", session.getToken())
            .queryParam("oauthRole", session.getRole())
            .queryParam("oauthEmail", session.getEmail())
            .queryParam("oauthName", session.getDisplayName())
            .queryParam("oauthMainAdmin", session.isMainAdmin())
            .toUriString();

        response.sendRedirect(redirectUrl);
    }

    private String stringAttribute(OAuth2User principal, String key) {
        Object value = principal.getAttributes().get(key);
        return value == null ? "" : String.valueOf(value).trim();
    }

    private String firstPresent(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "";
    }
}
