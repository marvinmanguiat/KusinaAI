package com.marvinm.KusinaAI.dto.menu;

public record CostEstimationResponse(
    String currency,
    double estimatedTotal,
    String notes
) {
}
