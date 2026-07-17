package com.marvinm.KusinaAI.config;

import com.marvinm.KusinaAI.entity.UserEntity;
import com.marvinm.KusinaAI.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedDefaultAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.existsByEmailIgnoreCase("admin@kusina.ai")) {
                return;
            }

            UserEntity admin = new UserEntity();
            admin.setEmail("admin@kusina.ai");
            admin.setFullName("Administrator");
            admin.setMobilePhone("+639170000000");
            admin.setPassword(passwordEncoder.encode("Admin@123"));
            admin.setRoles("ROLE_ADMIN,ROLE_USER");
            admin.setStatus("Active");
            admin.setPasswordChangeRequired(false);
            userRepository.save(admin);
        };
    }
}
