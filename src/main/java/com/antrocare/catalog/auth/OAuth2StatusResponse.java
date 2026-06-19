package com.antrocare.catalog.auth;

import java.util.List;

public record OAuth2StatusResponse(
    boolean enabled,
    List<String> providers
) {
}
