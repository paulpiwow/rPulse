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

import com.rpulse.backend.hierarchy.entity.Tag;
import com.rpulse.backend.hierarchy.repository.DatasourceRepository;
import com.rpulse.backend.hierarchy.repository.TagRepository;

/**
 * CRUD endpoints for {@link Tag}. Talks to the repository directly — no service
 * layer yet (same pattern as {@code SiteController}).
 *
 * <p>Tags sit under a data source in the hierarchy, so the collection is exposed
 * both flat ({@code /tags}) and nested under its parent
 * ({@code /datasources/{datasourceId}/tags}) — including creation, which connects
 * the new tag to the data source named in the path (the Connect Tags screen).
 */
@RestController
public class TagController {

    private final TagRepository tags;
    private final DatasourceRepository datasources;

    public TagController(TagRepository tags, DatasourceRepository datasources) {
        this.tags = tags;
        this.datasources = datasources;
    }

    /** GET /api/v1/tags → every tag. */
    @GetMapping("/tags")
    public List<Tag> list() {
        return tags.findAll();
    }

    /** GET /api/v1/datasources/{datasourceId}/tags → the tags under one data source. */
    @GetMapping("/datasources/{datasourceId}/tags")
    public List<Tag> listByDatasource(@PathVariable Long datasourceId) {
        return tags.findByDatasourceId(datasourceId);
    }

    /**
     * POST /api/v1/datasources/{datasourceId}/tags → connect a tag under a data source. The
     * parent link comes from the path. Replies "not found" if the data source doesn't exist.
     */
    @PostMapping("/datasources/{datasourceId}/tags")
    public ResponseEntity<Tag> createUnderDatasource(@PathVariable Long datasourceId,
                                                     @RequestBody Tag tag) {
        return datasources.findById(datasourceId).map(datasource -> {
            tag.setDatasource(datasource);
            return ResponseEntity.status(HttpStatus.CREATED).body(tags.save(tag));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/tags/{id}")
    public ResponseEntity<Tag> get(@PathVariable Long id) {
        return tags.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/tags")
    public ResponseEntity<Tag> create(@RequestBody Tag tag) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tags.save(tag));
    }

    @PutMapping("/tags/{id}")
    public ResponseEntity<Tag> update(@PathVariable Long id, @RequestBody Tag body) {
        return tags.findById(id).map(existing -> {
            existing.setCode(body.getCode());
            existing.setDatasource(body.getDatasource());
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

    @DeleteMapping("/tags/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!tags.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        tags.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
