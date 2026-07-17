package com.marvinm.KusinaAI.dto.menu;

import java.util.List;

public record MenuRecipeResponse(
    String menuName,
    String description,
    int servings,
    List<IngredientResponse> ingredients,
    List<String> instructions,
    String imageUrl,
    NutritionFactsResponse nutritionFacts,
    CostEstimationResponse costEstimation
) {
}