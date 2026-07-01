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

import com.rpulse.backend.hierarchy.entity.CTag;
import com.rpulse.backend.hierarchy.repository.AssetRepository;
import com.rpulse.backend.hierarchy.repository.CTagRepository;

/**
 * CRUD endpoints for {@link CTag} (computed tags). Talks to the repository
 * directly — no service layer yet (same pattern as {@code SiteController}).
 *
 * <p>Computed tags are assigned to an asset, so the collection is exposed both
 * flat ({@code /ctags}) and nested under its parent
 * ({@code /assets/{assetId}/ctags}) — including creation, which assigns the new
 * ctag to the asset named in the path. (Its source tags may reference any tag in
 * the hierarchy, but its monitoring home is this asset.)
 */
@RestController
public class CTagController {

    private final CTagRepository ctags;
    private final AssetRepository assets;

    public CTagController(CTagRepository ctags, AssetRepository assets) {
        this.ctags = ctags;
        this.assets = assets;
    }

    /** GET /api/v1/ctags → every computed tag. */
    @GetMapping("/ctags")
    public List<CTag> list() {
        return ctags.findAll();
    }

    /** GET /api/v1/assets/{assetId}/ctags → the computed tags assigned to one asset. */
    @GetMapping("/assets/{assetId}/ctags")
    public List<CTag> listByAsset(@PathVariable Long assetId) {
        return ctags.findByAssetId(assetId);
    }

    /**
     * POST /api/v1/assets/{assetId}/ctags → create a computed tag under an asset. The parent
     * link comes from the path. Replies "not found" if the asset doesn't exist.
     */
    @PostMapping("/assets/{assetId}/ctags")
    public ResponseEntity<CTag> createUnderAsset(@PathVariable Long assetId,
                                                 @RequestBody CTag ctag) {
        return assets.findById(assetId).map(asset -> {
            ctag.setAsset(asset);
            return ResponseEntity.status(HttpStatus.CREATED).body(ctags.save(ctag));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/ctags/{id}")
    public ResponseEntity<CTag> get(@PathVariable Long id) {
        return ctags.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/ctags")
    public ResponseEntity<CTag> create(@RequestBody CTag ctag) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ctags.save(ctag));
    }

    @PutMapping("/ctags/{id}")
    public ResponseEntity<CTag> update(@PathVariable Long id, @RequestBody CTag body) {
        return ctags.findById(id).map(existing -> {
            existing.setCode(body.getCode());
            existing.setAsset(body.getAsset());
            existing.setTagName(body.getTagName());
            existing.setMeasurementType(body.getMeasurementType());
            existing.setUnit(body.getUnit());
            existing.setSamplingRate(body.getSamplingRate());
            existing.setCalculationType(body.getCalculationType());
            existing.setExpression(body.getExpression());
            existing.setSourceTagIds(body.getSourceTagIds());
            existing.setPlot(body.isPlot());
            return ResponseEntity.ok(ctags.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/ctags/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!ctags.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        ctags.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
