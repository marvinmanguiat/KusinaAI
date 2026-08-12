package com.marvinm.menuservice.dto;

public record NutritionFactsResponse(
    double calories,
    double proteinGrams,
    double carbohydratesGrams,
    double fatGrams
) {
}
