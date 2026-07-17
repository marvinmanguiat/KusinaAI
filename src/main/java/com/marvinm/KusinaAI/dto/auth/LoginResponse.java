package com.marvinm.KusinaAI.dto.auth;

public record LoginResponse(String token, UserProfileResponse user) {
}
