package com.marvinm.KusinaAI.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record ProfileUpdateRequest(
    @NotBlank(message = "Full name is required")
    String fullName,
    String mobilePhone,
    String avatarUrl
) {
}