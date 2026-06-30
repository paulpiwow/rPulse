package com.rpulse.backend.hierarchy.web;

import java.util.List;

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

import com.rpulse.backend.hierarchy.entity.Machine;
import com.rpulse.backend.hierarchy.repository.MachineRepository;

/**
 * CRUD endpoints for {@link Machine}. Talks to the repository directly — no
 * service layer yet (same pattern as {@code SiteController}).
 */
@RestController
@RequestMapping("/api/machines")
public class MachineController {

    private final MachineRepository machines;

    public MachineController(MachineRepository machines) {
        this.machines = machines;
    }

    /**
     * Lists all machines, or — when the optional {@code assetId} query param is
     * supplied — only the machines under that asset. (Non-standard CRUD: the
     * filter supports drilling down the hierarchy, e.g.
     * {@code GET /api/machines?assetId=1}.)
     */
    @GetMapping
    public List<Machine> list(@RequestParam(required = false) Long assetId) {
        return assetId == null ? machines.findAll() : machines.findByAssetId(assetId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Machine> get(@PathVariable Long id) {
        return machines.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Machine create(@RequestBody Machine machine) {
        return machines.save(machine);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Machine> update(@PathVariable Long id, @RequestBody Machine body) {
        return machines.findById(id).map(existing -> {
            existing.setCode(body.getCode());
            existing.setAsset(body.getAsset());
            existing.setMachineName(body.getMachineName());
            existing.setMachineType(body.getMachineType());
            existing.setLocation(body.getLocation());
            existing.setDescription(body.getDescription());
            return ResponseEntity.ok(machines.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!machines.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        machines.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
