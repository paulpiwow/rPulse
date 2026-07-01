package com.rpulse.backend.hierarchy.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rpulse.backend.hierarchy.entity.Datasource;

/**
 * Spring Data repository for {@link Datasource}. Auto-detected by component scan
 * (everything under {@code com.rpulse.backend} is scanned), so no extra
 * configuration is needed.
 */
public interface DatasourceRepository extends JpaRepository<Datasource, Long> {

    Optional<Datasource> findByCode(String code);

    List<Datasource> findByMachineId(Long machineId);
}
