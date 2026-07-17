package com.marvinm.KusinaAI.dto.menu;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SaveMenuHistoryRequest(
    @NotBlank(message = "Search query is required")
    String searchQuery,
    @NotNull(message = "Menu is required")
    @Valid
    MenuRecipeResponse menu
) {
}