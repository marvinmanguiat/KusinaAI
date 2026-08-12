package com.marvinm.menuservice.dto;

public record MenuRecipeResponse(
    String menuName,
    String description,
    int servings,
    String imageUrl,
    java.util.List<IngredientResponse> ingredients,
    java.util.List<String> instructions,
    NutritionFactsResponse nutritionFacts,
    CostEstimationResponse costEstimation
) {
}
