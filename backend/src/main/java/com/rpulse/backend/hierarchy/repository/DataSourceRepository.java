package com.rpulse.backend.hierarchy.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rpulse.backend.hierarchy.entity.DataSource;

/**
 * Spring Data repository for {@link DataSource}. Auto-detected by component scan
 * (everything under {@code com.rpulse.backend} is scanned), so no extra
 * configuration is needed.
 */
public interface DataSourceRepository extends JpaRepository<DataSource, Long> {

    Optional<DataSource> findByCode(String code);

    List<DataSource> findByMachineId(Long machineId);
}
