package com.marvinm.KusinaAI.service;

import com.marvinm.KusinaAI.dto.auth.ChangePasswordRequest;
import com.marvinm.KusinaAI.dto.auth.ForgotPasswordRequest;
import com.marvinm.KusinaAI.dto.auth.ForgotPasswordResponse;
import com.marvinm.KusinaAI.dto.auth.ProfileUpdateRequest;
import com.marvinm.KusinaAI.dto.auth.RegisterRequest;
import com.marvinm.KusinaAI.dto.auth.UserProfileResponse;
import com.marvinm.KusinaAI.entity.UserEntity;
import com.marvinm.KusinaAI.repository.UserRepository;
import java.security.SecureRandom;
import java.util.Locale;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private static final Logger LOGGER = LoggerFactory.getLogger(AuthService.class);
    private static final String TEMP_PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        JavaMailSender mailSender
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender;
    }

    public void register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        String normalizedMobilePhone = normalizeMobilePhone(request.mobilePhone());

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new IllegalArgumentException("Email is already registered");
        }

        ensureMobilePhoneAvailable(normalizedMobilePhone, null);

        UserEntity user = new UserEntity();
        user.setEmail(normalizedEmail);
        user.setFullName(request.fullName().trim());
        user.setMobilePhone(normalizedMobilePhone);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRoles("ROLE_USER");
        user.setStatus("Active");
        user.setPasswordChangeRequired(false);

        userRepository.save(user);
    }

    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        String normalizedEmail = normalizeEmail(request.email());

        UserEntity user = userRepository.findByEmailIgnoreCase(normalizedEmail)
            .orElseThrow(() -> new IllegalArgumentException("Account with this email does not exist"));

        String temporaryPassword = generateTemporaryPassword();

        user.setPassword(passwordEncoder.encode(temporaryPassword));
        user.setPasswordChangeRequired(true);
        userRepository.save(user);

        boolean emailSent = sendTemporaryPasswordEmail(user, temporaryPassword);

        String message = emailSent
            ? "A temporary password has been sent to your email"
            : "Temporary password generated, but email delivery is not configured yet";

        return new ForgotPasswordResponse(message, emailSent, emailSent ? null : temporaryPassword);
    }

    public UserProfileResponse getCurrentUserProfile(String email) {
        UserEntity user = getUserByEmail(email);
        return toUserProfileResponse(user);
    }

    public UserProfileResponse updateProfile(String email, ProfileUpdateRequest request) {
        UserEntity user = getUserByEmail(email);
        String normalizedMobilePhone = normalizeMobilePhone(request.mobilePhone());
        ensureMobilePhoneAvailable(normalizedMobilePhone, user.getId());

        user.setFullName(request.fullName().trim());
        user.setMobilePhone(normalizedMobilePhone);
        user.setAvatarUrl(normalizeOptional(request.avatarUrl()));

        userRepository.save(user);

        return toUserProfileResponse(user);
    }

    public void changePassword(String email, ChangePasswordRequest request) {
        UserEntity user = getUserByEmail(email);

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        user.setPasswordChangeRequired(false);
        userRepository.save(user);
    }

    public UserEntity upsertOAuthUser(String email, String fullName) {
        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail == null || normalizedEmail.isBlank()) {
            throw new IllegalArgumentException("OAuth account email is not available");
        }

        UserEntity user = userRepository.findByEmailIgnoreCase(normalizedEmail)
            .orElseGet(() -> {
                UserEntity created = new UserEntity();
                created.setEmail(normalizedEmail);
                created.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
                created.setRoles("ROLE_USER");
                created.setStatus("Active");
                created.setPasswordChangeRequired(false);
                return created;
            });

        String normalizedName = normalizeOptional(fullName);
        if (normalizedName != null) {
            user.setFullName(normalizedName);
        } else if (user.getFullName() == null || user.getFullName().isBlank()) {
            user.setFullName(formatFullNameFromEmail(normalizedEmail));
        }

        if (user.getRoles() == null || user.getRoles().isBlank()) {
            user.setRoles("ROLE_USER");
        }

        if (user.getStatus() == null || user.getStatus().isBlank()) {
            user.setStatus("Active");
        }

        return userRepository.save(user);
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeMobilePhone(String mobilePhone) {
        String normalized = normalizeOptional(mobilePhone);
        if (normalized == null) {
            return null;
        }

        String compact = normalized.replaceAll("[\\s()-]", "");

        if (compact.startsWith("+63")) {
            compact = compact.substring(3);
        } else if (compact.startsWith("63")) {
            compact = compact.substring(2);
        } else if (compact.startsWith("0")) {
            compact = compact.substring(1);
        }

        if (!compact.matches("9\\d{9}")) {
            throw new IllegalArgumentException("Mobile phone must follow +63 format (e.g., +639171234567)");
        }

        return "+63" + compact;
    }

    private void ensureMobilePhoneAvailable(String mobilePhone, Long currentUserId) {
        if (mobilePhone == null) {
            return;
        }

        userRepository.findByMobilePhone(mobilePhone)
            .ifPresent(existing -> {
                boolean sameUser = currentUserId != null && currentUserId.equals(existing.getId());
                if (!sameUser) {
                    throw new IllegalArgumentException("Mobile phone is already registered");
                }
            });
    }

    private String formatFullNameFromEmail(String email) {
        String localPart = email.contains("@") ? email.substring(0, email.indexOf('@')) : email;

        String[] chunks = localPart.split("[._-]+");
        StringBuilder builder = new StringBuilder();
        for (String chunk : chunks) {
            if (chunk.isBlank()) {
                continue;
            }

            if (builder.length() > 0) {
                builder.append(' ');
            }

            builder.append(Character.toUpperCase(chunk.charAt(0)));
            if (chunk.length() > 1) {
                builder.append(chunk.substring(1));
            }
        }

        return builder.length() == 0 ? "Kusina User" : builder.toString();
    }

    private UserEntity getUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(normalizeEmail(email))
            .orElseThrow(() -> new IllegalArgumentException("Account with this email does not exist"));
    }

    private UserProfileResponse toUserProfileResponse(UserEntity user) {
        return new UserProfileResponse(
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            user.getMobilePhone(),
            user.getAvatarUrl(),
            user.getRoles(),
            user.getStatus(),
            user.isPasswordChangeRequired()
        );
    }

    private String generateTemporaryPassword() {
        StringBuilder builder = new StringBuilder();

        for (int index = 0; index < 10; index++) {
            int randomIndex = secureRandom.nextInt(TEMP_PASSWORD_CHARS.length());
            builder.append(TEMP_PASSWORD_CHARS.charAt(randomIndex));
        }

        return builder.toString();
    }

    private boolean sendTemporaryPasswordEmail(UserEntity user, String temporaryPassword) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("KusinaAI Temporary Password");
            message.setText(
                "Hello " + user.getFullName() + ",\n\n" +
                "Your temporary password is: " + temporaryPassword + "\n" +
                "Please sign in and change your password immediately."
            );

            mailSender.send(message);
            return true;
        } catch (Exception ex) {
            LOGGER.warn("Unable to send temporary password email to {}", user.getEmail(), ex);
            return false;
        }
    }
}
