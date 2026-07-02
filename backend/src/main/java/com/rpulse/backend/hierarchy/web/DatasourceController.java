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

import com.rpulse.backend.hierarchy.entity.DataSourceType;
import com.rpulse.backend.hierarchy.entity.Datasource;
import com.rpulse.backend.hierarchy.repository.DatasourceRepository;
import com.rpulse.backend.hierarchy.repository.MachineRepository;
import com.rpulse.backend.influx.AvailableTag;
import com.rpulse.backend.influx.RTruthConnector;

/**
 * CRUD endpoints for {@link Datasource}. Talks to the repository directly — no
 * service layer yet (same pattern as {@code SiteController}).
 *
 * <p>Data sources sit under a machine in the hierarchy, so the collection is exposed both
 * flat ({@code /datasources}) and nested under its parent
 * ({@code /machines/{machineCode}/datasources}) — including creation. Resources are
 * addressed by {@code code}.
 */
@RestController
public class DatasourceController {

    private final DatasourceRepository datasources;
    private final MachineRepository machines;
    private final RTruthConnector connector;

    public DatasourceController(DatasourceRepository datasources, MachineRepository machines,
                               RTruthConnector connector) {
        this.datasources = datasources;
        this.machines = machines;
        this.connector = connector;
    }

    /** GET /api/v1/datasources → every data source. */
    @GetMapping("/datasources")
    public List<Datasource> list() {
        return datasources.findAll();
    }

    /** GET /api/v1/machines/{machineCode}/datasources → the data sources under one machine. */
    @GetMapping("/machines/{machineCode}/datasources")
    public ResponseEntity<List<Datasource>> listByMachine(@PathVariable String machineCode) {
        return machines.findByCode(machineCode)
                .map(machine -> ResponseEntity.ok(datasources.findByMachineId(machine.getId())))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/v1/machines/{machineCode}/datasources → add a data source under a machine.
     * The parent link comes from the path. Replies "not found" if the machine doesn't exist.
     */
    @PostMapping("/machines/{machineCode}/datasources")
    public ResponseEntity<Datasource> createUnderMachine(@PathVariable String machineCode,
                                                         @RequestBody Datasource datasource) {
        return machines.findByCode(machineCode).map(machine -> {
            datasource.setMachine(machine);
            return ResponseEntity.status(HttpStatus.CREATED).body(datasources.save(datasource));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/datasources/{code}")
    public ResponseEntity<Datasource> get(@PathVariable String code) {
        return datasources.findByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/v1/datasources/{code}/available-tags → the tags this source publishes, for the
     * left side of the Connect Tags screen. Asks the source's connector what it has: a
     * {@code HISTORIAN} source is answered by querying rTruth; other kinds (e.g. {@code PLC})
     * have no live catalog in Phase 6 and return an empty list. "Not found" if no such source.
     */
    @GetMapping("/datasources/{code}/available-tags")
    public ResponseEntity<List<AvailableTag>> availableTags(@PathVariable String code) {
        return datasources.findByCode(code)
                .map(ds -> ResponseEntity.ok(
                        ds.getType() == DataSourceType.HISTORIAN
                                ? connector.listAvailableTags()
                                : List.<AvailableTag>of()))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/datasources")
    public ResponseEntity<Datasource> create(@RequestBody Datasource datasource) {
        return ResponseEntity.status(HttpStatus.CREATED).body(datasources.save(datasource));
    }

    @PutMapping("/datasources/{code}")
    public ResponseEntity<Datasource> update(@PathVariable String code, @RequestBody Datasource body) {
        return datasources.findByCode(code).map(existing -> {
            existing.setCode(body.getCode());
            existing.setMachine(body.getMachine());
            existing.setSourceName(body.getSourceName());
            existing.setSourceType(body.getSourceType());
            existing.setType(body.getType());
            existing.setProtocol(body.getProtocol());
            existing.setNetworkAddress(body.getNetworkAddress());
            existing.setLocation(body.getLocation());
            return ResponseEntity.ok(datasources.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/datasources/{code}")
    public ResponseEntity<Void> delete(@PathVariable String code) {
        return datasources.findByCode(code).map(datasource -> {
            datasources.delete(datasource);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
