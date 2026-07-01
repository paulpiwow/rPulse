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

import com.rpulse.backend.hierarchy.entity.CTag;
import com.rpulse.backend.hierarchy.repository.CTagRepository;

/**
 * CRUD endpoints for {@link CTag} (computed tags). Talks to the repository
 * directly — no service layer yet (same pattern as {@code SiteController}).
 */
@RestController
@RequestMapping("/api/ctags")
public class CTagController {

    private final CTagRepository ctags;

    public CTagController(CTagRepository ctags) {
        this.ctags = ctags;
    }

    /**
     * Lists all computed tags, or — when the optional {@code assetId} query param
     * is supplied — only the ctags under that asset. (Non-standard CRUD: the
     * filter supports drilling down the hierarchy, e.g.
     * {@code GET /api/ctags?assetId=1}.)
     */
    @GetMapping
    public List<CTag> list(@RequestParam(required = false) Long assetId) {
        return assetId == null ? ctags.findAll() : ctags.findByAssetId(assetId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CTag> get(@PathVariable Long id) {
        return ctags.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<CTag> create(@RequestBody CTag ctag) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ctags.save(ctag));
    }

    @PutMapping("/{id}")
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!ctags.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        ctags.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
