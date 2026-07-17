package com.marvinm.KusinaAI.dto.users;

import jakarta.validation.constraints.NotBlank;

public record UpdateUserStatusRequest(
    @NotBlank(message = "Status is required")
    String status
) {
}