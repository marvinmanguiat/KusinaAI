package com.marvinm.KusinaAI.dto.menu;

public record MenuSearchResponse(
    MenuRecipeResponse menu,
    String source,
    String message
) {
}