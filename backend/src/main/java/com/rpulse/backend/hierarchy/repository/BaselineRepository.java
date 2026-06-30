package com.rpulse.backend.hierarchy.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rpulse.backend.hierarchy.entity.Baseline;

/**
 * Spring Data repository for {@link Baseline} (the {@code baseline_rule} table).
 * Auto-detected by component scan (everything under {@code com.rpulse.backend}
 * is scanned), so no extra configuration is needed.
 */
public interface BaselineRepository extends JpaRepository<Baseline, Long> {

    Optional<Baseline> findByCode(String code);

    List<Baseline> findByAssetId(Long assetId);
}
