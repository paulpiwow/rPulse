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

import com.rpulse.backend.hierarchy.entity.Asset;
import com.rpulse.backend.hierarchy.repository.AssetRepository;

/**
 * CRUD endpoints for {@link Asset}. Talks to the repository directly — there is
 * no domain logic beyond persistence yet, so a service layer is intentionally
 * omitted (same pattern as {@code SiteController}).
 */
@RestController
@RequestMapping("/api/assets")
public class AssetController {

    private final AssetRepository assets;

    public AssetController(AssetRepository assets) {
        this.assets = assets;
    }

    /**
     * Lists all assets, or — when the optional {@code siteId} query param is
     * supplied — only the assets under that site. (Non-standard CRUD: the filter
     * supports drilling down the hierarchy, e.g. {@code GET /api/assets?siteId=1}.)
     */
    @GetMapping
    public List<Asset> list(@RequestParam(required = false) Long siteId) {
        return siteId == null ? assets.findAll() : assets.findBySiteId(siteId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Asset> get(@PathVariable Long id) {
        return assets.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Asset> create(@RequestBody Asset asset) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assets.save(asset));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Asset> update(@PathVariable Long id, @RequestBody Asset body) {
        return assets.findById(id).map(existing -> {
            existing.setCode(body.getCode());
            existing.setSite(body.getSite());
            existing.setAssetName(body.getAssetName());
            existing.setLocation(body.getLocation());
            existing.setAssetType(body.getAssetType());
            existing.setAssignedTo(body.getAssignedTo());
            existing.setBaselineRequired(body.isBaselineRequired());
            existing.setEnabled(body.isEnabled());
            existing.setDescription(body.getDescription());
            return ResponseEntity.ok(assets.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!assets.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        assets.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
