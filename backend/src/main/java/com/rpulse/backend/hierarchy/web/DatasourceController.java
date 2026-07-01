package com.rpulse.backend.hierarchy.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.rpulse.backend.hierarchy.entity.Datasource;
import com.rpulse.backend.hierarchy.repository.DatasourceRepository;

/**
 * CRUD endpoints for {@link Datasource}. Talks to the repository directly — no
 * service layer yet (same pattern as {@code SiteController}).
 *
 * <p>Data sources sit under a machine in the hierarchy, so the collection is
 * exposed both flat ({@code /datasources}) and nested under its parent
 * ({@code /machines/{machineId}/datasources}).
 */
@RestController
public class DatasourceController {

    private final DatasourceRepository datasources;

    public DatasourceController(DatasourceRepository datasources) {
        this.datasources = datasources;
    }

    /** GET /api/v1/datasources → every data source. */
    @GetMapping("/datasources")
    public List<Datasource> list() {
        return datasources.findAll();
    }

    /** GET /api/v1/machines/{machineId}/datasources → the data sources under one machine. */
    @GetMapping("/machines/{machineId}/datasources")
    public List<Datasource> listByMachine(@PathVariable Long machineId) {
        return datasources.findByMachineId(machineId);
    }

    @GetMapping("/datasources/{id}")
    public ResponseEntity<Datasource> get(@PathVariable Long id) {
        return datasources.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/datasources")
    public ResponseEntity<Datasource> create(@RequestBody Datasource datasource) {
        return ResponseEntity.status(HttpStatus.CREATED).body(datasources.save(datasource));
    }

    @PutMapping("/datasources/{id}")
    public ResponseEntity<Datasource> update(@PathVariable Long id, @RequestBody Datasource body) {
        return datasources.findById(id).map(existing -> {
            existing.setCode(body.getCode());
            existing.setMachine(body.getMachine());
            existing.setSourceName(body.getSourceName());
            existing.setSourceType(body.getSourceType());
            existing.setProtocol(body.getProtocol());
            existing.setNetworkAddress(body.getNetworkAddress());
            existing.setLocation(body.getLocation());
            return ResponseEntity.ok(datasources.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/datasources/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!datasources.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        datasources.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
