package com.rpulse.backend.hierarchy.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rpulse.backend.hierarchy.entity.Asset;

/**
 * Spring Data repository for {@link Asset}. Auto-detected by component scan
 * (everything under {@code com.rpulse.backend} is scanned), so no extra
 * configuration is needed.
 */
public interface AssetRepository extends JpaRepository<Asset, Long> {

    Optional<Asset> findByCode(String code);

    List<Asset> findBySiteId(Long siteId);
}
