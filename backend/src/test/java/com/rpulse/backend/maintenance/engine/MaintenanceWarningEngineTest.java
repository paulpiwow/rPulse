package com.rpulse.backend.maintenance.engine;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import com.rpulse.backend.hierarchy.entity.Asset;
import com.rpulse.backend.hierarchy.entity.Baseline;
import com.rpulse.backend.hierarchy.entity.Tag;
import com.rpulse.backend.hierarchy.repository.BaselineRepository;
import com.rpulse.backend.influx.LocalInfluxStore;
import com.rpulse.backend.influx.RollingStatistics;
import com.rpulse.backend.influx.TagReading;
import com.rpulse.backend.maintenance.entity.MaintenanceWarningHistory;
import com.rpulse.backend.maintenance.repository.MaintenanceWarningHistoryRepository;

/**
 * Deterministic behaviour test for {@link MaintenanceWarningEngine}. The baseline and warning
 * repositories are mocked (backed by in-memory maps so ids/codes round-trip), and the local
 * Influx store is a hand-controlled {@link FakeLocalStore}, so the drift lifecycle can be driven
 * exactly and asserted without a database or a live feed. Mirrors the alarm engine's test.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MaintenanceWarningEngineTest {

    private static final String TAG_KEY = "suct-press";

    @Mock BaselineRepository baselineRepo;
    @Mock MaintenanceWarningHistoryRepository warningRepo;

    private final FakeLocalStore localStore = new FakeLocalStore();
    private final Map<Long, MaintenanceWarningHistory> warningById = new HashMap<>();
    private final Map<String, MaintenanceWarningHistory> warningByCode = new HashMap<>();
    private final AtomicLong warningSeq = new AtomicLong(1);

    private MaintenanceWarningEngine engine;

    @BeforeEach
    void setUp() {
        engine = newEngine("EITHER", 3);

        // An in-memory stand-in for the maintenance_warning_history table so save/find
        // round-trip like the real repo.
        when(warningRepo.save(any(MaintenanceWarningHistory.class))).thenAnswer(inv -> {
            MaintenanceWarningHistory w = inv.getArgument(0);
            if (w.getId() == null) {
                ReflectionTestUtils.setField(w, "id", warningSeq.getAndIncrement());
            }
            warningById.put(w.getId(), w);
            warningByCode.put(w.getCode(), w);
            return w;
        });
        when(warningRepo.findById(anyLong()))
                .thenAnswer(inv -> Optional.ofNullable(warningById.get(inv.getArgument(0))));
        when(warningRepo.findByCode(anyString()))
                .thenAnswer(inv -> Optional.ofNullable(warningByCode.get(inv.getArgument(0))));
        when(warningRepo.findFirstByBaseline_IdAndStatusInOrderByTripTimeDesc(anyLong(), any()))
                .thenReturn(Optional.empty());
    }

    private MaintenanceWarningEngine newEngine(String mode, double multiplier) {
        return new MaintenanceWarningEngine(baselineRepo, warningRepo, localStore, multiplier, mode);
    }

    @Test
    void newDrift_writesActiveWarning_andReturnsIt() {
        when(baselineRepo.findAll()).thenReturn(List.of(baseline()));
        localStore.values.put(TAG_KEY, 150.0);      // way over high(60) and mean+3*std(56)

        List<MaintenanceWarningHistory> active = engine.evaluate();

        assertThat(active).hasSize(1);
        MaintenanceWarningHistory w = active.get(0);
        assertThat(w.getStatus()).isEqualTo("ACTIVE");
        assertThat(w.getTagCode()).isEqualTo(TAG_KEY);
        assertThat(w.getScope()).isEqualTo("Tag");
        assertThat(w.getDirection()).isEqualTo("ABOVE");
        assertThat(w.getBasis()).isEqualTo("BOTH");         // broke both the range and the std band
        assertThat(w.getObservedValue()).isEqualByComparingTo("150");
        assertThat(w.getAssetId()).isEqualTo(10L);
        assertThat(w.getOwner()).isEqualTo("Compressor Operations");
        assertThat(warningByCode).hasSize(1);
    }

    @Test
    void evaluate_fetchesAllTagsInOneRoundTrip() {
        when(baselineRepo.findAll()).thenReturn(List.of(baseline()));
        localStore.values.put(TAG_KEY, 150.0);

        engine.evaluate();

        assertThat(localStore.getLatestManyCalls).isEqualTo(1);
    }

    @Test
    void driftWithinRangeButOutsideStdBand_firesUnderEither() {
        when(baselineRepo.findAll()).thenReturn(List.of(baseline()));
        localStore.values.put(TAG_KEY, 58.0);       // inside range[40,60] but above mean+3*std(56)

        List<MaintenanceWarningHistory> active = engine.evaluate();

        assertThat(active).hasSize(1);
        assertThat(active.get(0).getBasis()).isEqualTo("STDDEV");
        assertThat(active.get(0).getDirection()).isEqualTo("ABOVE");
    }

    @Test
    void rangeMode_ignoresAStdBandOnlyDrift() {
        engine = newEngine("RANGE", 3);
        when(baselineRepo.findAll()).thenReturn(List.of(baseline()));
        localStore.values.put(TAG_KEY, 58.0);       // outside std band, but inside low/high

        assertThat(engine.evaluate()).isEmpty();
        assertThat(warningByCode).isEmpty();
    }

    @Test
    void belowLow_recordsBelowDirection() {
        when(baselineRepo.findAll()).thenReturn(List.of(baseline()));
        localStore.values.put(TAG_KEY, 30.0);       // under low(40) and under mean-3*std(44)

        MaintenanceWarningHistory w = engine.evaluate().get(0);

        assertThat(w.getDirection()).isEqualTo("BELOW");
        assertThat(w.getBasis()).isEqualTo("BOTH");
    }

    @Test
    void readingInsideBaseline_producesNoWarning() {
        when(baselineRepo.findAll()).thenReturn(List.of(baseline()));
        localStore.values.put(TAG_KEY, 50.0);       // dead on target

        assertThat(engine.evaluate()).isEmpty();
        assertThat(warningByCode).isEmpty();
    }

    @Test
    void continuingDrift_refreshesTheSameRow_neverWritesADuplicate() {
        when(baselineRepo.findAll()).thenReturn(List.of(baseline()));
        localStore.values.put(TAG_KEY, 150.0);

        engine.evaluate();
        List<MaintenanceWarningHistory> secondPass = engine.evaluate();

        assertThat(secondPass).hasSize(1);
        assertThat(warningByCode).hasSize(1);       // still one row, just refreshed
    }

    @Test
    void evaluate_autoClearsWhenReadingReturnsToNormal() {
        when(baselineRepo.findAll()).thenReturn(List.of(baseline()));

        localStore.values.put(TAG_KEY, 150.0);      // drift
        MaintenanceWarningHistory open = engine.evaluate().get(0);

        localStore.values.put(TAG_KEY, 50.0);        // back to normal
        List<MaintenanceWarningHistory> active = engine.evaluate();

        assertThat(active).isEmpty();
        assertThat(open.getStatus()).isEqualTo("CLEARED");
        assertThat(open.getClearTime()).isNotNull();
    }

    @Test
    void disabledBaseline_isIgnored() {
        Baseline off = baseline();
        off.setEnabled(false);
        when(baselineRepo.findAll()).thenReturn(List.of(off));
        localStore.values.put(TAG_KEY, 150.0);

        assertThat(engine.evaluate()).isEmpty();
        assertThat(warningByCode).isEmpty();
    }

    @Test
    void assetScopeBaseline_isSkipped_becauseItHasNoSingleSeries() {
        Baseline assetScope = baseline();
        assetScope.setScope("Asset");
        assetScope.setTag(null);
        when(baselineRepo.findAll()).thenReturn(List.of(assetScope));
        localStore.values.put(TAG_KEY, 150.0);

        assertThat(engine.evaluate()).isEmpty();
        assertThat(warningByCode).isEmpty();
    }

    @Test
    void scheduledEvaluate_runsTheSameEvaluation() {
        when(baselineRepo.findAll()).thenReturn(List.of(baseline()));
        localStore.values.put(TAG_KEY, 150.0);

        engine.scheduledEvaluate();

        verify(baselineRepo, atLeastOnce()).findAll();
        assertThat(warningByCode).hasSize(1);
    }

    // -----------------------------------------------------------------------

    /** A Tag-scoped baseline: normal range [40, 60], average 50, std dev 2 (so 3-sigma band is [44, 56]). */
    private Baseline baseline() {
        Baseline b = new Baseline();
        ReflectionTestUtils.setField(b, "id", 1L);
        b.setCode("BL-1");
        b.setScope("Tag");

        Asset asset = new Asset();
        ReflectionTestUtils.setField(asset, "id", 10L);
        asset.setCode("AST-1");
        b.setAsset(asset);

        Tag tag = new Tag();
        tag.setCode(TAG_KEY);
        b.setTag(tag);

        b.setBaselineLow(new BigDecimal("40"));
        b.setBaselineHigh(new BigDecimal("60"));
        b.setBaselineTarget(new BigDecimal("50"));
        b.setBaselineStdDev(new BigDecimal("2"));
        b.setEnabled(true);
        b.setOwner("Compressor Operations");
        return b;
    }

    /** A fully controllable local Influx store: values are set by the test; counts the deduped fetches. */
    private static final class FakeLocalStore implements LocalInfluxStore {
        final Map<String, Double> values = new HashMap<>();
        int getLatestManyCalls = 0;

        @Override
        public void writePoint(TagReading reading, RollingStatistics statistics) {
            values.put(reading.tagKey(), reading.value());
        }

        @Override
        public Optional<TagReading> getLatest(String tagKey) {
            Double v = values.get(tagKey);
            return v == null ? Optional.empty() : Optional.of(new TagReading(tagKey, v, Instant.now()));
        }

        @Override
        public Map<String, TagReading> getLatest(Collection<String> tagKeys) {
            getLatestManyCalls++;
            Map<String, TagReading> out = new LinkedHashMap<>();
            for (String key : tagKeys) {
                Double v = values.get(key);
                if (v != null) {
                    out.put(key, new TagReading(key, v, Instant.now()));
                }
            }
            return out;
        }
    }
}
