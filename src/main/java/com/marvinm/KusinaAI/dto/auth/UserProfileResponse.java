package com.marvinm.KusinaAI.dto.auth;

public record UserProfileResponse(
    Long id,
    String fullName,
    String email,
    String mobilePhone,
    String avatarUrl,
    String roles,
    String status,
    boolean passwordChangeRequired
) {
}