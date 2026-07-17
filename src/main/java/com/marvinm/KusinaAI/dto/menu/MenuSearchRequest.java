package com.marvinm.KusinaAI.dto.menu;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record MenuSearchRequest(
    @NotBlank(message = "Search query is required")
    String query,
    @Min(value = 1, message = "Servings must be at least 1")
    int servings,
    String cookMode
) {
}