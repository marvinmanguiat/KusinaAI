package com.marvinm.menuservice.dto;

public record IngredientResponse(
    String name,
    double quantity,
    String unit
) {
}
