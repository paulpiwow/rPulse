package com.rpulse.backend.operate;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rpulse.backend.alarmadmin.engine.ActiveAlarm;
import com.rpulse.backend.alarmadmin.engine.AlarmEngineService;
import com.rpulse.backend.alarmadmin.entity.AlarmHistory;
import com.rpulse.backend.alarmadmin.repository.AlarmHistoryRepository;
import com.rpulse.backend.hierarchy.entity.Asset;
import com.rpulse.backend.hierarchy.entity.Site;
import com.rpulse.backend.hierarchy.repository.AssetRepository;
import com.rpulse.backend.hierarchy.repository.SiteRepository;
import com.rpulse.backend.operate.SiteStatusResponse.AssetStatus;
import com.rpulse.backend.operate.SiteStatusResponse.TrendCount;
import com.rpulse.backend.operate.SiteStatusResponse.TrendSeries;

/**
 * Assembles the Site Status screen: it runs a live alarm evaluation and a maintenance
 * deviation check, rolls the results up per asset, and appends a 14-day Asset Health Trend.
 * Because it calls the engine, opening the screen also records any newly-firing alarm as a
 * side effect.
 */
@Service
public class SiteStatusService {

    private static final int TREND_DAYS = 14;
    private static final String RED = "red";

    private final SiteRepository sites;
    private final AssetRepository assets;
    private final AlarmHistoryRepository history;
    private final AlarmEngineService engine;
    private final MaintenanceService maintenance;

    public SiteStatusService(SiteRepository sites, AssetRepository assets,
                             AlarmHistoryRepository history, AlarmEngineService engine,
                             MaintenanceService maintenance) {
        this.sites = sites;
        this.assets = assets;
        this.history = history;
        this.engine = engine;
        this.maintenance = maintenance;
    }

    @Transactional
    public SiteStatusResponse build() {
        String siteName = sites.findAll().stream().findFirst().map(Site::getSiteName).orElse("rPulse");

        List<ActiveAlarm> active = engine.evaluate();
        List<MaintenanceWarning> warnings = maintenance.evaluate();

        // Per-asset tallies keyed by the surrogate asset id (alarms) and asset code (warnings).
        Map<Long, Long> activeByAsset = active.stream()
                .filter(a -> a.assetId() != null)
                .collect(Collectors.groupingBy(ActiveAlarm::assetId, Collectors.counting()));
        Map<Long, Boolean> redByAsset = active.stream()
                .filter(a -> a.assetId() != null)
                .collect(Collectors.toMap(ActiveAlarm::assetId,
                        a -> RED.equalsIgnoreCase(a.severity()), (x, y) -> x || y));
        Map<String, Long> devByAsset = warnings.stream()
                .filter(w -> w.assetId() != null)
                .collect(Collectors.groupingBy(MaintenanceWarning::assetId, Collectors.counting()));

        List<AssetStatus> assetStatuses = new ArrayList<>();
        for (Asset asset : assets.findAll()) {
            int activeCount = activeByAsset.getOrDefault(asset.getId(), 0L).intValue();
            int devCount = devByAsset.getOrDefault(asset.getCode(), 0L).intValue();
            boolean red = redByAsset.getOrDefault(asset.getId(), false);
            String status = red ? "RED" : (activeCount > 0 || devCount > 0 ? "YELLOW" : "GREEN");
            assetStatuses.add(new AssetStatus(
                    asset.getCode(), asset.getAssetName(), asset.getLocation(),
                    status, activeCount, devCount));
        }

        return new SiteStatusResponse(
                siteName,
                assetStatuses.size(),
                active.size(),
                warnings.size(),
                assetStatuses,
                buildTrend(warnings.size()));
    }

    /**
     * A lightweight 14-day trend. Per-day active-alarm counts come from alarm_history trip
     * times; warnings aren't historised in Phase 6, so only today carries the current count.
     */
    private TrendSeries buildTrend(int currentWarnings) {
        Map<LocalDate, Long> tripsByDay = history.findAll().stream()
                .map(AlarmHistory::getTripTime)
                .filter(t -> t != null)
                .map(t -> t.atZoneSameInstant(ZoneOffset.UTC).toLocalDate())
                .collect(Collectors.groupingBy(d -> d, Collectors.counting()));

        LocalDate today = OffsetDateTime.now(ZoneOffset.UTC).toLocalDate();
        List<TrendCount> points = new ArrayList<>();
        for (int i = TREND_DAYS - 1; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            long alarms = tripsByDay.getOrDefault(day, 0L);
            long warnings = (i == 0) ? currentWarnings : 0L;
            points.add(new TrendCount(day.atStartOfDay().atOffset(ZoneOffset.UTC), alarms, warnings));
        }
        return new TrendSeries(TREND_DAYS + "_DAYS", points);
    }
}
