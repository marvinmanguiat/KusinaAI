package com.marvinm.menuservice.dto;

public record CostEstimationResponse(
    String currency,
    double estimatedTotal,
    String notes
) {
}
