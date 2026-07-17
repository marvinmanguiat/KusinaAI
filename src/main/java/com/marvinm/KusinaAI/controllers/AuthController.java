package com.marvinm.KusinaAI.controllers;

import com.marvinm.KusinaAI.dto.auth.ChangePasswordRequest;
import com.marvinm.KusinaAI.dto.auth.ForgotPasswordRequest;
import com.marvinm.KusinaAI.dto.auth.ForgotPasswordResponse;
import com.marvinm.KusinaAI.dto.auth.LoginRequest;
import com.marvinm.KusinaAI.dto.auth.LoginResponse;
import com.marvinm.KusinaAI.dto.auth.ProfileUpdateRequest;
import com.marvinm.KusinaAI.dto.auth.RegisterRequest;
import com.marvinm.KusinaAI.dto.auth.UserProfileResponse;
import com.marvinm.KusinaAI.dto.common.MessageResponse;
import com.marvinm.KusinaAI.security.JwtService;
import com.marvinm.KusinaAI.service.AuthService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final AuthService authService;

    public AuthController(
        AuthenticationManager authenticationManager,
        JwtService jwtService,
        AuthService authService
    ) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
            );

            UserDetails user = (UserDetails) authentication.getPrincipal();
            String token = jwtService.generateToken(user);
            UserProfileResponse profile = authService.getCurrentUserProfile(user.getUsername());
            return ResponseEntity.ok(new LoginResponse(token, profile));
        } catch (DisabledException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "This account has been disabled"));
        } catch (BadCredentialsException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Invalid username or password"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(new MessageResponse("User registered successfully"));
        } catch (IllegalArgumentException ex) {
            HttpStatus status = ex.getMessage() != null && ex.getMessage().contains("already")
                ? HttpStatus.CONFLICT
                : HttpStatus.BAD_REQUEST;

            return ResponseEntity.status(status)
                .body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            ForgotPasswordResponse response = authService.forgotPassword(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", ex.getMessage()));
        }
    }

    @GetMapping("/me")
    public UserProfileResponse me(Authentication authentication) {
        return authService.getCurrentUserProfile(authentication.getName());
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(
        Authentication authentication,
        @Valid @RequestBody ProfileUpdateRequest request
    ) {
        try {
            UserProfileResponse profile = authService.updateProfile(authentication.getName(), request);
            return ResponseEntity.ok(profile);
        } catch (IllegalArgumentException ex) {
            HttpStatus status = ex.getMessage() != null && ex.getMessage().contains("already")
                ? HttpStatus.CONFLICT
                : HttpStatus.BAD_REQUEST;

            return ResponseEntity.status(status)
                .body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/me/change-password")
    public ResponseEntity<?> changePassword(
        Authentication authentication,
        @Valid @RequestBody ChangePasswordRequest request
    ) {
        try {
            authService.changePassword(authentication.getName(), request);
            return ResponseEntity.ok(new MessageResponse("Password updated successfully"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }
}
