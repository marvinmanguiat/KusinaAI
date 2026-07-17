package com.marvinm.KusinaAI.controllers;

import com.marvinm.KusinaAI.dto.users.UpdateUserStatusRequest;
import com.marvinm.KusinaAI.dto.users.UserSummaryResponse;
import com.marvinm.KusinaAI.service.UserManagementService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserManagementController {

    private final UserManagementService userManagementService;

    public UserManagementController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @GetMapping
    public List<UserSummaryResponse> listUsers() {
        return userManagementService.listUsers();
    }

    @PatchMapping("/{userId}/status")
    public ResponseEntity<?> updateUserStatus(
        @PathVariable Long userId,
        Authentication authentication,
        @Valid @RequestBody UpdateUserStatusRequest request
    ) {
        try {
            return ResponseEntity.ok(
                userManagementService.updateUserStatus(userId, request, authentication.getName())
            );
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/{userId}/promote-admin")
    public ResponseEntity<?> promoteToAdmin(@PathVariable Long userId, Authentication authentication) {
        try {
            return ResponseEntity.ok(
                userManagementService.promoteToAdmin(userId, authentication.getName())
            );
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }
}