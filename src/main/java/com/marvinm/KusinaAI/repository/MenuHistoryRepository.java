package com.marvinm.KusinaAI.repository;

import com.marvinm.KusinaAI.entity.MenuHistoryEntity;
import com.marvinm.KusinaAI.entity.UserEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MenuHistoryRepository extends JpaRepository<MenuHistoryEntity, Long> {

    List<MenuHistoryEntity> findByUserOrderByCreatedAtDesc(UserEntity user);
}