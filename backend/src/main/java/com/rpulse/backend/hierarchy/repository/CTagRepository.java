package com.rpulse.backend.hierarchy.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rpulse.backend.hierarchy.entity.CTag;

/**
 * Spring Data repository for {@link CTag}. Auto-detected by component scan
 * (everything under {@code com.rpulse.backend} is scanned), so no extra
 * configuration is needed.
 */
public interface CTagRepository extends JpaRepository<CTag, Long> {

    Optional<CTag> findByCode(String code);

    List<CTag> findByAssetId(Long assetId);
}
