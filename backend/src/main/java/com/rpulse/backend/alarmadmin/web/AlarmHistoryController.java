package com.rpulse.backend.alarmadmin.web;

import java.time.OffsetDateTime;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.rpulse.backend.alarmadmin.entity.AlarmHistory;
import com.rpulse.backend.alarmadmin.repository.AlarmHistoryRepository;
import com.rpulse.backend.hierarchy.repository.AssetRepository;
import com.rpulse.backend.web.PageResponse;

/**
 * The Alarm History screen — a read-only view of past alarms. Pure Postgres, no Influx and
 * no engine. Lists what fired, when, who acknowledged/cleared it, and how long it lasted.
 *
 * <p>Reached at web addresses starting with /api/v1/alarms/history.
 */
@RestController
@RequestMapping("/alarms/history")
public class AlarmHistoryController {

    private static final int DEFAULT_SIZE = 50;

    private final AlarmHistoryRepository history;
    private final AssetRepository assets;

    public AlarmHistoryController(AlarmHistoryRepository history, AssetRepository assets) {
        this.history = history;
        this.assets = assets;
    }

    /**
     * Paginated history, newest first. Optional filters: {@code from}/{@code to} (ISO
     * timestamps on trip time) and {@code assetId} (the asset <em>code</em>). Standard
     * {@code ?page=N&size=M} pagination (defaults page 0, size 50). An unknown {@code assetId}
     * simply yields an empty page.
     */
    @GetMapping
    public PageResponse<AlarmHistory> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to,
            @RequestParam(required = false) String assetId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "" + DEFAULT_SIZE) int size) {

        Long assetPk = assetId == null ? null
                : assets.findByCode(assetId).map(a -> a.getId()).orElse(-1L); // -1 => matches nothing
        Pageable pageable = PageRequest.of(page, size);   // ordering is in the query
        return PageResponse.of(history.search(assetPk, from, to, pageable));
    }

    /** One history record by its {@code code}, or "not found". */
    @GetMapping("/{id}")
    public ResponseEntity<AlarmHistory> getOne(@PathVariable String id) {
        return history.findByCode(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}
