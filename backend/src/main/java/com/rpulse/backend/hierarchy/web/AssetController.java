package com.rpulse.backend.hierarchy.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.rpulse.backend.hierarchy.entity.Asset;
import com.rpulse.backend.hierarchy.repository.AssetRepository;
import com.rpulse.backend.hierarchy.repository.BaselineRepository;
import com.rpulse.backend.hierarchy.repository.CTagRepository;
import com.rpulse.backend.hierarchy.repository.DatasourceRepository;
import com.rpulse.backend.hierarchy.repository.MachineRepository;
import com.rpulse.backend.hierarchy.repository.TagRepository;
import com.rpulse.backend.hierarchy.web.AssetTree.BaselineNode;
import com.rpulse.backend.hierarchy.web.AssetTree.CTagNode;
import com.rpulse.backend.hierarchy.web.AssetTree.DatasourceNode;
import com.rpulse.backend.hierarchy.web.AssetTree.MachineNode;
import com.rpulse.backend.hierarchy.web.AssetTree.TagNode;

/**
 * CRUD endpoints for {@link Asset}, plus the nested sub-tree read. Talks to the
 * repositories directly — no service layer yet (same pattern as {@code SiteController}).
 *
 * <p>Assets sit under a site in the hierarchy, so the collection is exposed both flat
 * ({@code /assets}) and nested under its parent ({@code /sites/{siteId}/assets}). A single
 * asset is returned as its full {@link AssetTree} (machines → data sources → tags, plus
 * ctags and baselines), which is what the Asset Configuration screen loads in one shot.
 */
@RestController
public class AssetController {

    private final AssetRepository assets;
    private final MachineRepository machines;
    private final DatasourceRepository datasources;
    private final TagRepository tags;
    private final CTagRepository ctags;
    private final BaselineRepository baselines;

    public AssetController(AssetRepository assets, MachineRepository machines,
                           DatasourceRepository datasources, TagRepository tags,
                           CTagRepository ctags, BaselineRepository baselines) {
        this.assets = assets;
        this.machines = machines;
        this.datasources = datasources;
        this.tags = tags;
        this.ctags = ctags;
        this.baselines = baselines;
    }

    /** GET /api/v1/assets → every asset. */
    @GetMapping("/assets")
    public List<Asset> list() {
        return assets.findAll();
    }

    /** GET /api/v1/sites/{siteId}/assets → the assets under one site. */
    @GetMapping("/sites/{siteId}/assets")
    public List<Asset> listBySite(@PathVariable Long siteId) {
        return assets.findBySiteId(siteId);
    }

    /** GET /api/v1/assets/{id} → one asset with its machines, data sources, tags, ctags and baselines nested. */
    @GetMapping("/assets/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<AssetTree> get(@PathVariable Long id) {
        return assets.findById(id)
                .map(asset -> ResponseEntity.ok(toTree(asset)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/assets")
    public ResponseEntity<Asset> create(@RequestBody Asset asset) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assets.save(asset));
    }

    @PutMapping("/assets/{id}")
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

    @DeleteMapping("/assets/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!assets.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        assets.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // -----------------------------------------------------------------------
    // Sub-tree assembly
    // -----------------------------------------------------------------------

    private AssetTree toTree(Asset asset) {
        List<MachineNode> machineNodes = machines.findByAssetId(asset.getId()).stream()
                .map(machine -> new MachineNode(
                        machine.getId(), machine.getCode(), machine.getMachineName(),
                        machine.getMachineType(),
                        datasources.findByMachineId(machine.getId()).stream()
                                .map(ds -> new DatasourceNode(
                                        ds.getId(), ds.getCode(), ds.getSourceName(),
                                        ds.getSourceType(), ds.getProtocol(),
                                        tags.findByDatasourceId(ds.getId()).stream()
                                                .map(tag -> new TagNode(
                                                        tag.getId(), tag.getCode(), tag.getTagName(),
                                                        tag.getMeasurementType(), tag.getUnit()))
                                                .toList()))
                                .toList()))
                .toList();

        List<CTagNode> ctagNodes = ctags.findByAssetId(asset.getId()).stream()
                .map(ctag -> new CTagNode(
                        ctag.getId(), ctag.getCode(), ctag.getTagName(),
                        ctag.getCalculationType(), ctag.getExpression()))
                .toList();

        List<BaselineNode> baselineNodes = baselines.findByAssetId(asset.getId()).stream()
                .map(baseline -> new BaselineNode(
                        baseline.getId(), baseline.getCode(), baseline.getScope(),
                        baseline.getBaselineLow(), baseline.getBaselineTarget(), baseline.getBaselineHigh()))
                .toList();

        return new AssetTree(
                asset.getId(), asset.getCode(), asset.getAssetName(), asset.getLocation(),
                asset.getAssetType(), asset.isEnabled(),
                machineNodes, ctagNodes, baselineNodes);
    }
}
