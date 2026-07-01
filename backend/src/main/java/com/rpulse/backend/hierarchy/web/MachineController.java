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

import com.rpulse.backend.hierarchy.entity.Machine;
import com.rpulse.backend.hierarchy.repository.AssetRepository;
import com.rpulse.backend.hierarchy.repository.MachineRepository;

/**
 * CRUD endpoints for {@link Machine}. Talks to the repository directly — no
 * service layer yet (same pattern as {@code SiteController}).
 *
 * <p>Machines sit under an asset in the hierarchy, so the collection is exposed
 * both flat ({@code /machines}) and nested under its parent
 * ({@code /assets/{assetId}/machines}) — including creation, which links the new
 * machine to the asset named in the path.
 */
@RestController
public class MachineController {

    private final MachineRepository machines;
    private final AssetRepository assets;

    public MachineController(MachineRepository machines, AssetRepository assets) {
        this.machines = machines;
        this.assets = assets;
    }

    /** GET /api/v1/machines → every machine. */
    @GetMapping("/machines")
    public List<Machine> list() {
        return machines.findAll();
    }

    /** GET /api/v1/assets/{assetId}/machines → the machines under one asset. */
    @GetMapping("/assets/{assetId}/machines")
    public List<Machine> listByAsset(@PathVariable Long assetId) {
        return machines.findByAssetId(assetId);
    }

    /**
     * POST /api/v1/assets/{assetId}/machines → add a machine under an asset. The parent
     * link comes from the path; the body carries the machine's own fields (code, name, …).
     * Replies "not found" if the asset doesn't exist.
     */
    @PostMapping("/assets/{assetId}/machines")
    public ResponseEntity<Machine> createUnderAsset(@PathVariable Long assetId,
                                                    @RequestBody Machine machine) {
        return assets.findById(assetId).map(asset -> {
            machine.setAsset(asset);
            return ResponseEntity.status(HttpStatus.CREATED).body(machines.save(machine));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/machines/{id}")
    public ResponseEntity<Machine> get(@PathVariable Long id) {
        return machines.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/machines")
    public ResponseEntity<Machine> create(@RequestBody Machine machine) {
        return ResponseEntity.status(HttpStatus.CREATED).body(machines.save(machine));
    }

    @PutMapping("/machines/{id}")
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

    @DeleteMapping("/machines/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!machines.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        machines.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
