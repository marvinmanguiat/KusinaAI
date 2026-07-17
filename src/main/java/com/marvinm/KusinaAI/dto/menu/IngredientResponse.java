package com.marvinm.KusinaAI.dto.menu;

public record IngredientResponse(
    String name,
    double quantity,
    String unit
) {
}