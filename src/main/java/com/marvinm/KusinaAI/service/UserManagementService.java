package com.marvinm.KusinaAI.service;

import com.marvinm.KusinaAI.dto.users.UpdateUserStatusRequest;
import com.marvinm.KusinaAI.dto.users.UserSummaryResponse;
import com.marvinm.KusinaAI.entity.UserEntity;
import com.marvinm.KusinaAI.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class UserManagementService {

    private final UserRepository userRepository;

    public UserManagementService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<UserSummaryResponse> listUsers() {
        return userRepository.findAll().stream()
            .map(this::toUserSummary)
            .toList();
    }

    public UserSummaryResponse updateUserStatus(Long userId, UpdateUserStatusRequest request, String actingEmail) {
        UserEntity user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String normalizedStatus = normalizeStatus(request.status());

        if (user.getEmail().equalsIgnoreCase(actingEmail) && !"Active".equals(normalizedStatus)) {
            throw new IllegalArgumentException("You cannot disable your own account");
        }

        user.setStatus(normalizedStatus);
        userRepository.save(user);

        return toUserSummary(user);
    }

    public UserSummaryResponse promoteToAdmin(Long userId, String actingEmail) {
        UserEntity user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getRoles() != null && user.getRoles().contains("ROLE_ADMIN")) {
            throw new IllegalArgumentException("User is already an administrator");
        }

        user.setRoles("ROLE_ADMIN");
        userRepository.save(user);

        return toUserSummary(user);
    }

    private UserSummaryResponse toUserSummary(UserEntity user) {
        return new UserSummaryResponse(
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            user.getMobilePhone(),
            formatRole(user.getRoles()),
            user.getStatus(),
            user.getAvatarUrl()
        );
    }

    private String normalizeStatus(String status) {
        String normalized = status == null ? "" : status.trim();

        if (normalized.equalsIgnoreCase("active")) {
            return "Active";
        }

        if (normalized.equalsIgnoreCase("inactive")) {
            return "Inactive";
        }

        throw new IllegalArgumentException("Status must be Active or Inactive");
    }

    private String formatRole(String roles) {
        if (roles == null || roles.isBlank()) {
            return "User";
        }

        if (roles.contains("ROLE_ADMIN")) {
            return "Administrator";
        }

        return "User";
    }
}