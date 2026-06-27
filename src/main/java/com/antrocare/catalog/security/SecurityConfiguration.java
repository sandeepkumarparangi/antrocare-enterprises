package com.antrocare.catalog.security;

import java.util.Arrays;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

    private final String allowedOrigins;
    private final boolean oauth2Enabled;
    private final OAuth2LoginSuccessHandler oauth2LoginSuccessHandler;

    public SecurityConfiguration(
        @Value("${antrocare.allowed-origins}") String allowedOrigins,
        @Value("${antrocare.oauth2.enabled:}") String oauth2Enabled,
        @Value("${spring.security.oauth2.client.registration.google.client-id:}") String googleClientId,
        @Value("${spring.security.oauth2.client.registration.google.client-secret:}") String googleClientSecret,
        OAuth2LoginSuccessHandler oauth2LoginSuccessHandler
    ) {
        this.allowedOrigins = allowedOrigins;
        this.oauth2Enabled = oauth2Enabled(oauth2Enabled, googleClientId, googleClientSecret);
        this.oauth2LoginSuccessHandler = oauth2LoginSuccessHandler;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.cors(Customizer.withDefaults());
        http.csrf(csrf -> csrf.ignoringRequestMatchers("/api/**", "/h2-console/**"));
        http.formLogin(AbstractHttpConfigurer::disable);
        http.httpBasic(AbstractHttpConfigurer::disable);
        http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED));
        http.authorizeHttpRequests(auth -> auth
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
            .requestMatchers(
                "/",
                "/index.html",
                "/assets/**",
                "/manifest.webmanifest",
                "/service-worker.js",
                "/rendered/**",
                "/api/**",
                "/h2-console/**"
            ).permitAll()
            .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
            .anyRequest().permitAll()
        );
        http.headers(headers -> headers
            .contentSecurityPolicy(csp -> csp.policyDirectives(
                "default-src 'self'; " +
                "img-src 'self' data: http: https:; " +
                "style-src 'self' 'unsafe-inline'; " +
                "script-src 'self'; " +
                "connect-src 'self' http://localhost:8081 http://127.0.0.1:8081; " +
                "frame-ancestors 'self'"
            ))
            .frameOptions(frame -> frame.sameOrigin())
            .referrerPolicy(referrer -> referrer.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
            .permissionsPolicyHeader(policy -> policy.policy("camera=(), microphone=(), geolocation=()"))
        );

        if (oauth2Enabled) {
            http.oauth2Login(oauth2 -> oauth2.successHandler(oauth2LoginSuccessHandler));
        }

        return http.build();
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

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        Arrays.stream(allowedOrigins.split(","))
            .map(String::trim)
            .filter(origin -> !origin.isBlank())
            .forEach(configuration::addAllowedOrigin);
        configuration.addAllowedMethod("*");
        configuration.addAllowedHeader("*");
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
