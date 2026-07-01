package com.rpulse.backend.hierarchy.web;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
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
import com.rpulse.backend.hierarchy.repository.AssetRepository;
import com.rpulse.backend.hierarchy.repository.BaselineRepository;
import com.rpulse.backend.influx.Aggregates;
import com.rpulse.backend.influx.RTruthConnector;

/**
 * CRUD endpoints for {@link Baseline} (the {@code baseline_rule} table). Talks
 * to the repository directly — no service layer yet (same pattern as
 * {@code SiteController}).
 *
 * <p>Baselines apply to an asset (at Asset, Tag, or CTag scope), so the collection is
 * exposed both flat ({@code /baselines}) and nested under its parent asset
 * ({@code /assets/{assetCode}/baselines}), plus the reestablish action. Resources are
 * addressed by {@code code}.
 *
 * <p><strong>Scope/target invariant:</strong> a baseline's {@code scope}
 * ({@code Asset}/{@code Tag}/{@code CTag}) must agree with which target FK is set
 * ({@code tag} for Tag scope, {@code ctag} for CTag scope, neither for Asset scope). This
 * is enforced by the DB CHECK constraint, so a request body that violates it surfaces as a
 * persistence error rather than being silently saved. See {@link Baseline} for the full rule.
 */
@RestController
public class BaselineController {

    private final BaselineRepository baselines;
    private final AssetRepository assets;
    private final RTruthConnector connector;

    public BaselineController(BaselineRepository baselines, AssetRepository assets,
                             RTruthConnector connector) {
        this.baselines = baselines;
        this.assets = assets;
        this.connector = connector;
    }

    /** GET /api/v1/baselines → every baseline rule. */
    @GetMapping("/baselines")
    public List<Baseline> list() {
        return baselines.findAll();
    }

    /** GET /api/v1/assets/{assetCode}/baselines → the baseline rules under one asset. */
    @GetMapping("/assets/{assetCode}/baselines")
    public ResponseEntity<List<Baseline>> listByAsset(@PathVariable String assetCode) {
        return assets.findByCode(assetCode)
                .map(asset -> ResponseEntity.ok(baselines.findByAssetId(asset.getId())))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/v1/assets/{assetCode}/baselines/reestablish → recompute the asset's baselines
     * from a "known normal" time window. For each Tag/CTag-scoped baseline it runs an Influx
     * aggregation over the window (MIN/MAX/AVG/STDDEV) and writes the results back as the new
     * low/high/target/std-dev. Asset-scope baselines (no single series) are skipped. Returns
     * the updated baselines; "not found" if the asset doesn't exist.
     */
    @PostMapping("/assets/{assetCode}/baselines/reestablish")
    public ResponseEntity<List<Baseline>> reestablish(@PathVariable String assetCode,
                                                      @RequestBody ReestablishRequest body) {
        return assets.findByCode(assetCode).map(asset -> {
            List<Baseline> updated = new ArrayList<>();
            for (Baseline baseline : baselines.findByAssetId(asset.getId())) {
                String seriesKey = seriesKey(baseline);
                if (seriesKey == null) {
                    continue;   // Asset-scope baseline has no single series to aggregate
                }
                Aggregates agg = connector.getAggregates(seriesKey, body.windowStart(), body.windowEnd());
                baseline.setBaselineLow(scaled(agg.min()));
                baseline.setBaselineHigh(scaled(agg.max()));
                baseline.setBaselineTarget(scaled(agg.avg()));
                baseline.setBaselineStdDev(scaled(agg.stdDev()));
                updated.add(baselines.save(baseline));
            }
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/baselines/{code}")
    public ResponseEntity<Baseline> get(@PathVariable String code) {
        return baselines.findByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/baselines")
    public ResponseEntity<Baseline> create(@RequestBody Baseline baseline) {
        return ResponseEntity.status(HttpStatus.CREATED).body(baselines.save(baseline));
    }

    @PutMapping("/baselines/{code}")
    public ResponseEntity<Baseline> update(@PathVariable String code, @RequestBody Baseline body) {
        return baselines.findByCode(code).map(existing -> {
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

    @DeleteMapping("/baselines/{code}")
    public ResponseEntity<Void> delete(@PathVariable String code) {
        return baselines.findByCode(code).map(baseline -> {
            baselines.delete(baseline);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    /** The Influx series key for a baseline's target, or null for Asset-scope baselines. */
    private static String seriesKey(Baseline b) {
        if ("Tag".equalsIgnoreCase(b.getScope()) && b.getTag() != null) {
            return b.getTag().getCode();
        }
        if ("CTag".equalsIgnoreCase(b.getScope()) && b.getCtag() != null) {
            return b.getCtag().getCode();
        }
        return null;
    }

    private static BigDecimal scaled(double value) {
        return BigDecimal.valueOf(value).setScale(4, RoundingMode.HALF_UP);
    }

    /** Reestablish request body: the "known normal" window to aggregate over. */
    public record ReestablishRequest(Instant windowStart, Instant windowEnd) {
    }
}
