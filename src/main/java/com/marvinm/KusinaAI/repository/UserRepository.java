package com.marvinm.KusinaAI.repository;

import com.marvinm.KusinaAI.entity.UserEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByEmailIgnoreCase(String email);

    Optional<UserEntity> findByMobilePhone(String mobilePhone);

    boolean existsByEmailIgnoreCase(String email);
}
