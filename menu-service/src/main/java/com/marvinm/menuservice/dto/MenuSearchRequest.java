package com.marvinm.menuservice.dto;

import jakarta.validation.constraints.NotBlank;

public record MenuSearchRequest(
    @NotBlank(message = "Search query is required") String query,
    int servings,
    String cookMode
) {
}
