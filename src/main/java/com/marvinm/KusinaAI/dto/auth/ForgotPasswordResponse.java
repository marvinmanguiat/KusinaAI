package com.marvinm.KusinaAI.dto.auth;

public record ForgotPasswordResponse(
    String message,
    boolean emailSent,
    String temporaryPassword
) {
}