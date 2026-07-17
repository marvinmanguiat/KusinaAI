export interface Ingredient {
    name: string;
    quantity: number;
    unit: string;
}

export interface NutritionFacts {
    calories: number;
    proteinGrams: number;
    carbohydratesGrams: number;
    fatGrams: number;
}

export interface CostEstimation {
    currency: string;
    estimatedTotal: number;
    notes: string;
}

export interface MenuRecipe {
    menuName: string;
    description: string;
    servings: number;
    imageUrl?: string | null;
    ingredients: Ingredient[];
    instructions: string[];
    nutritionFacts: NutritionFacts;
    costEstimation: CostEstimation;
}

export interface MenuSearchResponse {
    menu: MenuRecipe;
    source: string;
    message: string;
}

export interface MenuHistoryEntry {
    id: number;
    searchQuery: string;
    createdAt: string;
    menu: MenuRecipe;
}