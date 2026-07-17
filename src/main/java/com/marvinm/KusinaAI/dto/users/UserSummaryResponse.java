package com.marvinm.KusinaAI.dto.users;

public record UserSummaryResponse(
    Long id,
    String name,
    String email,
    String mobilePhone,
    String role,
    String status,
    String avatarUrl
) {
}