package com.marvinm.KusinaAI.dto.menu;

public record NutritionFactsResponse(
    double calories,
    double proteinGrams,
    double carbohydratesGrams,
    double fatGrams
) {
}
