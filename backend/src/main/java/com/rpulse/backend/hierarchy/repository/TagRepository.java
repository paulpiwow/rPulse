package com.rpulse.backend.hierarchy.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rpulse.backend.hierarchy.entity.Tag;

/**
 * Spring Data repository for {@link Tag}. Auto-detected by component scan
 * (everything under {@code com.rpulse.backend} is scanned), so no extra
 * configuration is needed.
 */
public interface TagRepository extends JpaRepository<Tag, Long> {

    Optional<Tag> findByCode(String code);

    List<Tag> findByDatasourceId(Long datasourceId);
}
