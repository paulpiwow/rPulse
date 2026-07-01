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

import com.rpulse.backend.hierarchy.entity.Baseline;
import com.rpulse.backend.hierarchy.repository.BaselineRepository;

/**
 * CRUD endpoints for {@link Baseline} (the {@code baseline_rule} table). Talks
 * to the repository directly — no service layer yet (same pattern as
 * {@code SiteController}).
 *
 * <p>Baselines apply to an asset (at Asset, Tag, or CTag scope), so the
 * collection is exposed both flat ({@code /baselines}) and nested under its
 * parent asset ({@code /assets/{assetId}/baselines}).
 *
 * <p><strong>Scope/target invariant:</strong> a baseline's {@code scope}
 * ({@code Asset}/{@code Tag}/{@code CTag}) must agree with which target FK is
 * set ({@code tag} for Tag scope, {@code ctag} for CTag scope, neither for Asset
 * scope). This is enforced by the DB CHECK constraint, so a request body that
 * violates it surfaces as a persistence error rather than being silently saved.
 * See {@link Baseline} for the full rule.
 */
@RestController
public class BaselineController {

    private final BaselineRepository baselines;

    public BaselineController(BaselineRepository baselines) {
        this.baselines = baselines;
    }

    /** GET /api/v1/baselines → every baseline rule. */
    @GetMapping("/baselines")
    public List<Baseline> list() {
        return baselines.findAll();
    }

    /** GET /api/v1/assets/{assetId}/baselines → the baseline rules under one asset. */
    @GetMapping("/assets/{assetId}/baselines")
    public List<Baseline> listByAsset(@PathVariable Long assetId) {
        return baselines.findByAssetId(assetId);
    }

    @GetMapping("/baselines/{id}")
    public ResponseEntity<Baseline> get(@PathVariable Long id) {
        return baselines.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/baselines")
    public ResponseEntity<Baseline> create(@RequestBody Baseline baseline) {
        return ResponseEntity.status(HttpStatus.CREATED).body(baselines.save(baseline));
    }

    @PutMapping("/baselines/{id}")
    public ResponseEntity<Baseline> update(@PathVariable Long id, @RequestBody Baseline body) {
        return baselines.findById(id).map(existing -> {
            existing.setCode(body.getCode());
            existing.setScope(body.getScope());
            existing.setAsset(body.getAsset());
            existing.setTag(body.getTag());
            existing.setCtag(body.getCtag());
            existing.setMeasurementType(body.getMeasurementType());
            existing.setUnit(body.getUnit());
            existing.setBaselineLow(body.getBaselineLow());
            existing.setBaselineTarget(body.getBaselineTarget());
            existing.setBaselineHigh(body.getBaselineHigh());
            existing.setBaselineStdDev(body.getBaselineStdDev());
            existing.setEvaluationWindow(body.getEvaluationWindow());
            existing.setWarningDelay(body.getWarningDelay());
            existing.setEnabled(body.isEnabled());
            existing.setOwner(body.getOwner());
            return ResponseEntity.ok(baselines.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/baselines/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!baselines.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        baselines.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
