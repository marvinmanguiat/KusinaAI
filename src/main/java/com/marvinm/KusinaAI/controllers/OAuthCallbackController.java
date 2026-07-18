package com.marvinm.KusinaAI.controllers;

import com.marvinm.KusinaAI.security.AppSecurityProperties;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.net.URISyntaxException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.view.RedirectView;
import org.springframework.web.util.UriComponentsBuilder;

@Controller
public class OAuthCallbackController {

    private final AppSecurityProperties properties;

    @Value("${app.security.oauth2.frontend-callback-url}")
    private String frontendCallbackUrl;

    public OAuthCallbackController(AppSecurityProperties properties) {
        this.properties = properties;
    }

    @GetMapping("/oauth/callback")
    public Object redirectToFrontendCallback(
        @RequestParam MultiValueMap<String, String> queryParams,
        HttpServletRequest request
    ) {
        if (StringUtils.hasText(frontendCallbackUrl) && pointsToCurrentApplication(frontendCallbackUrl, request)) {
            return "forward:/index.html";
        }

        String callbackUrl = resolveFrontendCallbackUrl(request);
        UriComponentsBuilder redirectBuilder = UriComponentsBuilder.fromUriString(callbackUrl);

        MultiValueMap<String, String> safeQueryParams = new LinkedMultiValueMap<>(queryParams);
        safeQueryParams.forEach((key, values) -> values.forEach(value -> redirectBuilder.queryParam(key, value)));

        return new RedirectView(redirectBuilder.build(true).toUriString());
    }

    private String resolveFrontendCallbackUrl(HttpServletRequest request) {
        if (StringUtils.hasText(frontendCallbackUrl)) {
            return frontendCallbackUrl;
        }

        String allowedOrigin = properties.getCors().getAllowedOrigin();
        if (StringUtils.hasText(allowedOrigin)) {
            return trimTrailingSlash(allowedOrigin) + "/oauth/callback";
        }

        return "/oauth/callback";
    }

    private boolean pointsToCurrentApplication(String callbackUrl, HttpServletRequest request) {
        try {
            URI callbackUri = new URI(callbackUrl);
            return normalizedPort(callbackUri.getScheme(), callbackUri.getPort()) == normalizedPort(request.getScheme(), request.getServerPort())
                && request.getServerName().equalsIgnoreCase(callbackUri.getHost())
                && request.getScheme().equalsIgnoreCase(callbackUri.getScheme());
        } catch (URISyntaxException exception) {
            return false;
        }
    }

    private int normalizedPort(String scheme, int port) {
        if (port > 0) {
            return port;
        }

        if ("https".equalsIgnoreCase(scheme)) {
            return 443;
        }

        return 80;
    }

    private String trimTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}