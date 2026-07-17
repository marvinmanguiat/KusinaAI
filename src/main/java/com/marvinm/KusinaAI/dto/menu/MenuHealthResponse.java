package com.marvinm.KusinaAI.dto.menu;

public record MenuHealthResponse(
    boolean available,
    String message,
    long retryAfterMinutes
) {
}