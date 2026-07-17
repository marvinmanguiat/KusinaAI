package com.marvinm.KusinaAI.dto.menu;

import java.time.Instant;

public record MenuHistoryResponse(
    Long id,
    String searchQuery,
    Instant createdAt,
    MenuRecipeResponse menu
) {
}