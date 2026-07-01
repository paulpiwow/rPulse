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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.rpulse.backend.hierarchy.entity.DataSource;
import com.rpulse.backend.hierarchy.repository.DataSourceRepository;

/**
 * CRUD endpoints for {@link DataSource}. Talks to the repository directly — no
 * service layer yet (same pattern as {@code SiteController}).
 */
@RestController
@RequestMapping("/api/data-sources")
public class DataSourceController {

    private final DataSourceRepository dataSources;

    public DataSourceController(DataSourceRepository dataSources) {
        this.dataSources = dataSources;
    }

    /**
     * Lists all data sources, or — when the optional {@code machineId} query
     * param is supplied — only the data sources under that machine. (Non-standard
     * CRUD: the filter supports drilling down the hierarchy, e.g.
     * {@code GET /api/data-sources?machineId=1}.)
     */
    @GetMapping
    public List<DataSource> list(@RequestParam(required = false) Long machineId) {
        return machineId == null ? dataSources.findAll() : dataSources.findByMachineId(machineId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DataSource> get(@PathVariable Long id) {
        return dataSources.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<DataSource> create(@RequestBody DataSource dataSource) {
        return ResponseEntity.status(HttpStatus.CREATED).body(dataSources.save(dataSource));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DataSource> update(@PathVariable Long id, @RequestBody DataSource body) {
        return dataSources.findById(id).map(existing -> {
            existing.setCode(body.getCode());
            existing.setMachine(body.getMachine());
            existing.setSourceName(body.getSourceName());
            existing.setSourceType(body.getSourceType());
            existing.setProtocol(body.getProtocol());
            existing.setNetworkAddress(body.getNetworkAddress());
            existing.setLocation(body.getLocation());
            return ResponseEntity.ok(dataSources.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!dataSources.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        dataSources.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
