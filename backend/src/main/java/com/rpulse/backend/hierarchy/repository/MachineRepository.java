package com.rpulse.backend.hierarchy.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rpulse.backend.hierarchy.entity.Machine;

/**
 * Spring Data repository for {@link Machine}. Auto-detected by component scan
 * (everything under {@code com.rpulse.backend} is scanned), so no extra
 * configuration is needed.
 */
public interface MachineRepository extends JpaRepository<Machine, Long> {

    Optional<Machine> findByCode(String code);

    List<Machine> findByAssetId(Long assetId);
}
