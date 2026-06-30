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

import com.rpulse.backend.hierarchy.entity.Tag;
import com.rpulse.backend.hierarchy.repository.TagRepository;

/**
 * CRUD endpoints for {@link Tag}. Talks to the repository directly — no service
 * layer yet (same pattern as {@code SiteController}).
 */
@RestController
@RequestMapping("/api/tags")
public class TagController {

    private final TagRepository tags;

    public TagController(TagRepository tags) {
        this.tags = tags;
    }

    /**
     * Lists all tags, or — when the optional {@code dataSourceId} query param is
     * supplied — only the tags under that data source. (Non-standard CRUD: the
     * filter supports drilling down the hierarchy, e.g.
     * {@code GET /api/tags?dataSourceId=1}.)
     */
    @GetMapping
    public List<Tag> list(@RequestParam(required = false) Long dataSourceId) {
        return dataSourceId == null ? tags.findAll() : tags.findByDataSourceId(dataSourceId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Tag> get(@PathVariable Long id) {
        return tags.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Tag create(@RequestBody Tag tag) {
        return tags.save(tag);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Tag> update(@PathVariable Long id, @RequestBody Tag body) {
        return tags.findById(id).map(existing -> {
            existing.setCode(body.getCode());
            existing.setDataSource(body.getDataSource());
            existing.setTagName(body.getTagName());
            existing.setMeasurementType(body.getMeasurementType());
            existing.setUnit(body.getUnit());
            existing.setDataType(body.getDataType());
            existing.setSamplingRate(body.getSamplingRate());
            existing.setStorageMode(body.getStorageMode());
            existing.setMinValue(body.getMinValue());
            existing.setMaxValue(body.getMaxValue());
            existing.setInitialValue(body.getInitialValue());
            existing.setPlot(body.isPlot());
            existing.setColor(body.getColor());
            existing.setDescription(body.getDescription());
            return ResponseEntity.ok(tags.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!tags.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        tags.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
