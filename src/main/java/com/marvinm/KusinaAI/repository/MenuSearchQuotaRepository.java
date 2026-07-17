package com.marvinm.KusinaAI.repository;

import com.marvinm.KusinaAI.entity.MenuSearchQuotaEntity;
import com.marvinm.KusinaAI.entity.UserEntity;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MenuSearchQuotaRepository extends JpaRepository<MenuSearchQuotaEntity, Long> {

    Optional<MenuSearchQuotaEntity> findByUserAndSearchDate(UserEntity user, LocalDate searchDate);
}