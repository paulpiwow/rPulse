package com.rpulse.backend.hierarchy.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rpulse.backend.hierarchy.entity.Site;

/**
 * Spring Data repository for {@link Site}. Auto-detected by component scan
 * (everything under {@code com.rpulse.backend} is scanned), so no extra
 * configuration is needed.
 */
public interface SiteRepository extends JpaRepository<Site, Long> {

    Optional<Site> findByCode(String code);
}
