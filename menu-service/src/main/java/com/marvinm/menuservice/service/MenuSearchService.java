package com.marvinm.menuservice.service;

import com.marvinm.menuservice.dto.MenuSearchRequest;
import com.marvinm.menuservice.dto.MenuSearchResponse;
import org.springframework.stereotype.Service;

@Service
public class MenuSearchService {

    public MenuSearchResponse search(MenuSearchRequest request) {
        return new MenuSearchResponse(
            new com.marvinm.menuservice.dto.MenuRecipeResponse(
                "Sample " + request.query().trim(),
                "Microservice-ready menu suggestion",
                request.servings() > 0 ? request.servings() : 4,
                null,
                java.util.List.of(),
                java.util.List.of("Prep ingredients", "Cook and serve"),
                new com.marvinm.menuservice.dto.NutritionFactsResponse(320, 18, 40, 12),
                new com.marvinm.menuservice.dto.CostEstimationResponse("PHP", 180, "Estimated for a small household")
            ),
            "microservice",
            "Menu search handled by the dedicated menu microservice."
        );
    }
}
