package com.marvinm.KusinaAI.security;

import com.marvinm.KusinaAI.entity.UserEntity;
import com.marvinm.KusinaAI.repository.UserRepository;
import java.util.Arrays;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class ConfiguredUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public ConfiguredUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserEntity userEntity = userRepository.findByEmailIgnoreCase(username)
            .orElseThrow(() -> new UsernameNotFoundException("Invalid username or password"));

        String[] authorities = Arrays.stream(userEntity.getRoles().split(","))
            .map(String::trim)
            .filter(role -> !role.isBlank())
            .toArray(String[]::new);

        return User.withUsername(userEntity.getEmail())
            .password(userEntity.getPassword())
            .authorities(authorities)
            .disabled(!"Active".equalsIgnoreCase(userEntity.getStatus()))
            .build();
    }
}
