package com.marvinm.menuservice.dto;

public record MenuSearchResponse(
    MenuRecipeResponse menu,
    String source,
    String message
) {
}
