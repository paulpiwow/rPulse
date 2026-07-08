package com.rpulse.backend.influx;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.OptionalDouble;
import java.util.concurrent.locks.ReentrantLock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.rpulse.backend.hierarchy.entity.CTag;
import com.rpulse.backend.hierarchy.entity.Tag;
import com.rpulse.backend.hierarchy.repository.CTagRepository;
import com.rpulse.backend.hierarchy.repository.TagRepository;

/** Stage 1: copy connected source tags to local Influx, then derive and persist CTags. */
@Service
public class StageOneScheduler {
    private static final Logger log = LoggerFactory.getLogger(StageOneScheduler.class);
    private final TagRepository tags;
    private final CTagRepository ctags;
    private final RTruthConnector rtruth;
    private final LocalInfluxStore localStore;
    private final CTagEvaluator ctagEvaluator;
    private final RollingStatisticsCalculator statistics;
    private final ReentrantLock runLock = new ReentrantLock();

    public StageOneScheduler(TagRepository tags, CTagRepository ctags, RTruthConnector rtruth,
                             LocalInfluxStore localStore, CTagEvaluator ctagEvaluator,
                             RollingStatisticsCalculator statistics) {
        this.tags = tags;
        this.ctags = ctags;
        this.rtruth = rtruth;
        this.localStore = localStore;
        this.ctagEvaluator = ctagEvaluator;
        this.statistics = statistics;
    }

    @Scheduled(fixedDelayString = "${rpulse.stage1.interval-ms:10000}",
            initialDelayString = "${rpulse.stage1.initial-delay-ms:10000}")
    public void scheduledIngest() {
        if (!runLock.tryLock()) {
            log.warn("Skipping Stage 1 run because the previous run is still active");
            return;
        }
        try {
            ingest();
        } finally {
            runLock.unlock();
        }
    }

    /** Public deterministic entry point used by tests and operational tooling. */
    public void ingest() {
        Map<String, TagReading> fetchedByCode = new LinkedHashMap<>();
        for (Tag tag : tags.findAll()) {
            if (!connectedAndEnabled(tag)) continue;
            try {
                rtruth.getLatest(tag.getTagKey()).ifPresent(upstream -> {
                    TagReading local = new TagReading(tag.getCode(), upstream.value(), upstream.time());
                    localStore.writePoint(local, statistics.add(local));
                    fetchedByCode.put(tag.getCode(), local);
                });
            } catch (RuntimeException exception) {
                log.error("Stage 1 failed to fetch tag {} ({})", tag.getCode(), tag.getTagKey(), exception);
            }
        }

        Map<String, Double> values = new LinkedHashMap<>();
        fetchedByCode.forEach((key, reading) -> values.put(key, reading.value()));
        for (CTag ctag : ctags.findAll()) {
            if (ctag.getAsset() == null || !ctag.getAsset().isEnabled()) continue;
            OptionalDouble computed = ctagEvaluator.evaluate(ctag, values);
            if (computed.isEmpty()) continue;
            Instant time = CTagEvaluator.sourceKeys(ctag).stream().map(fetchedByCode::get)
                    .filter(reading -> reading != null).map(TagReading::time)
                    .max(Instant::compareTo).orElseGet(Instant::now);
            TagReading reading = new TagReading(ctag.getCode(), computed.getAsDouble(), time);
            try {
                localStore.writePoint(reading, statistics.add(reading));
                values.put(ctag.getCode(), reading.value());
            } catch (RuntimeException exception) {
                log.error("Stage 1 failed to persist CTag {}", ctag.getCode(), exception);
            }
        }
    }

    private static boolean connectedAndEnabled(Tag tag) {
        return tag.getCode() != null && tag.getTagKey() != null && !tag.getTagKey().isBlank()
                && tag.getDatasource() != null && tag.getDatasource().getMachine() != null
                && tag.getDatasource().getMachine().getAsset() != null
                && tag.getDatasource().getMachine().getAsset().isEnabled();
    }
}
