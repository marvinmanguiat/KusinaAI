package com.marvinm.KusinaAI.security;

import com.marvinm.KusinaAI.entity.UserEntity;
import com.marvinm.KusinaAI.service.AuthService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

@Component
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final AuthService authService;

    @Value("${app.security.oauth2.frontend-callback-url:http://localhost:5173/oauth/callback}")
    private String frontendCallbackUrl;

    public OAuth2AuthenticationSuccessHandler(JwtService jwtService, AuthService authService) {
        this.jwtService = jwtService;
        this.authService = authService;
    }

    @Override
    public void onAuthenticationSuccess(
        HttpServletRequest request,
        HttpServletResponse response,
        Authentication authentication
    ) throws IOException, ServletException {
        if (!(authentication.getPrincipal() instanceof OAuth2User oauth2User)) {
            response.sendRedirect(frontendCallbackUrl + "?error="
                + URLEncoder.encode("Unsupported OAuth2 principal", StandardCharsets.UTF_8));
            return;
        }

        String email = oauth2User.getAttribute("email");
        if (email == null || email.isBlank()) {
            response.sendRedirect(frontendCallbackUrl + "?error="
                + URLEncoder.encode("OAuth2 provider did not return email", StandardCharsets.UTF_8));
            return;
        }

        String name = oauth2User.getAttribute("name");
        UserEntity user = authService.upsertOAuthUser(email, name);

        String[] authorities = Arrays.stream(user.getRoles().split(","))
            .map(String::trim)
            .filter(role -> !role.isBlank())
            .toArray(String[]::new);

        UserDetails userDetails = User.withUsername(user.getEmail())
            .password(user.getPassword())
            .authorities(authorities)
            .disabled(!"Active".equalsIgnoreCase(user.getStatus()))
            .build();

        String token = jwtService.generateToken(userDetails);
        clearAuthenticationArtifacts(request);

        response.sendRedirect(frontendCallbackUrl + "?token="
            + URLEncoder.encode(token, StandardCharsets.UTF_8));
    }

    private void clearAuthenticationArtifacts(HttpServletRequest request) {
        SecurityContextHolder.clearContext();

        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }
}
