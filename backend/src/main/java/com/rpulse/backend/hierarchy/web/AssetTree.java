package com.rpulse.backend.hierarchy.web;

import java.math.BigDecimal;
import java.util.List;

/**
 * The full sub-tree for one asset — asset metadata plus its machines → data sources → tags,
 * its computed tags, and its baselines nested inline. Backs {@code GET /api/v1/assets/{id}}.
 * Compact nodes are used (rather than the raw entities) to keep the shape tidy and avoid
 * dragging each child's parent back-reference into the JSON.
 */
public record AssetTree(
        Long id,
        String code,
        String assetName,
        String location,
        String assetType,
        boolean enabled,
        List<MachineNode> machines,
        List<CTagNode> ctags,
        List<BaselineNode> baselines) {

    public record MachineNode(
            Long id,
            String code,
            String machineName,
            String machineType,
            List<DatasourceNode> datasources) {
    }

    public record DatasourceNode(
            Long id,
            String code,
            String sourceName,
            String sourceType,
            String protocol,
            List<TagNode> tags) {
    }

    public record TagNode(
            Long id,
            String code,
            String tagName,
            String measurementType,
            String unit) {
    }

    public record CTagNode(
            Long id,
            String code,
            String tagName,
            String calculationType,
            String expression) {
    }

    public record BaselineNode(
            Long id,
            String code,
            String scope,
            BigDecimal baselineLow,
            BigDecimal baselineTarget,
            BigDecimal baselineHigh) {
    }
}
