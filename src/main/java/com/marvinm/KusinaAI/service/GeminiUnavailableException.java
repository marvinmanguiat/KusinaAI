package com.marvinm.KusinaAI.service;

public class GeminiUnavailableException extends RuntimeException {

    private final long retryAfterMinutes;

    public GeminiUnavailableException(String message, long retryAfterMinutes) {
        super(message);
        this.retryAfterMinutes = retryAfterMinutes;
    }

    public long getRetryAfterMinutes() {
        return retryAfterMinutes;
    }
}