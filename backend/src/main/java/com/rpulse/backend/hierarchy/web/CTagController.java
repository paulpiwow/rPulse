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
 * <p>Computed tags are assigned to an asset, so the collection is exposed both flat
 * ({@code /ctags}) and nested under its parent ({@code /assets/{assetCode}/ctags}) —
 * including creation, which assigns the new ctag to the asset named in the path. (Its
 * source tags may reference any tag in the hierarchy, but its monitoring home is this
 * asset.) Resources are addressed by {@code code}.
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

    /** GET /api/v1/assets/{assetCode}/ctags → the computed tags assigned to one asset. */
    @GetMapping("/assets/{assetCode}/ctags")
    public ResponseEntity<List<CTag>> listByAsset(@PathVariable String assetCode) {
        return assets.findByCode(assetCode)
                .map(asset -> ResponseEntity.ok(ctags.findByAssetId(asset.getId())))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/v1/assets/{assetCode}/ctags → create a computed tag under an asset. The parent
     * link comes from the path. Replies "not found" if the asset doesn't exist.
     */
    @PostMapping("/assets/{assetCode}/ctags")
    public ResponseEntity<CTag> createUnderAsset(@PathVariable String assetCode,
                                                 @RequestBody CTag ctag) {
        return assets.findByCode(assetCode).map(asset -> {
            ctag.setAsset(asset);
            return ResponseEntity.status(HttpStatus.CREATED).body(ctags.save(ctag));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/ctags/{code}")
    public ResponseEntity<CTag> get(@PathVariable String code) {
        return ctags.findByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/ctags")
    public ResponseEntity<CTag> create(@RequestBody CTag ctag) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ctags.save(ctag));
    }

    @PutMapping("/ctags/{code}")
    public ResponseEntity<CTag> update(@PathVariable String code, @RequestBody CTag body) {
        return ctags.findByCode(code).map(existing -> {
            existing.setCode(body.getCode());
            existing.setAsset(body.getAsset());
            existing.setTagName(body.getTagName());
            existing.setCtagKey(body.getCtagKey());
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

    @DeleteMapping("/ctags/{code}")
    public ResponseEntity<Void> delete(@PathVariable String code) {
        return ctags.findByCode(code).map(ctag -> {
            ctags.delete(ctag);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
