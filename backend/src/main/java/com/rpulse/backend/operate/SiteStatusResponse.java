package com.rpulse.backend.operate;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * The Site Status screen payload: site-wide counts, a per-asset health rollup, and the Asset
 * Health Trend series.
 */
public record SiteStatusResponse(
        String siteName,
        int assetCount,
        int activeAlarmCount,
        int maintenanceWarningCount,
        List<AssetStatus> assets,
        TrendSeries trend) {

    /**
     * One asset's rollup. {@code status} is GREEN / YELLOW / RED: RED if any red-severity
     * alarm is firing, YELLOW if a lower alarm is firing or a baseline deviation exists,
     * else GREEN.
     */
    public record AssetStatus(
            String assetId,
            String name,
            String location,
            String status,
            int activeAlarms,
            int deviations) {
    }

    /** The trend series over a window, with per-point active-alarm and warning counts. */
    public record TrendSeries(String duration, List<TrendCount> points) {
    }

    public record TrendCount(OffsetDateTime timestamp, long activeAlarms, long warnings) {
    }
}
