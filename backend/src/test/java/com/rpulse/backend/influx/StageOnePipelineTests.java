package com.rpulse.backend.influx;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

import com.rpulse.backend.hierarchy.entity.Asset;
import com.rpulse.backend.hierarchy.entity.CTag;
import com.rpulse.backend.hierarchy.entity.Datasource;
import com.rpulse.backend.hierarchy.entity.Machine;
import com.rpulse.backend.hierarchy.entity.Tag;
import com.rpulse.backend.hierarchy.repository.CTagRepository;
import com.rpulse.backend.hierarchy.repository.TagRepository;

class StageOnePipelineTests {

    @Test
    void parsesInfluxUtcTimestampWithoutZoneSuffix() {
        assertThat(InfluxHttpSupport.instant("2026-07-05T02:00:00"))
                .isEqualTo(Instant.parse("2026-07-05T02:00:00Z"));
    }

    @Test
    void rollingStatisticsUseATrailingWindowAndSampleDeviation() {
        RollingStatisticsCalculator calculator = new RollingStatisticsCalculator(Duration.ofSeconds(10));
        Instant base = Instant.parse("2026-07-04T12:00:00Z");
        calculator.add(new TagReading("pressure", 10, base));
        calculator.add(new TagReading("pressure", 20, base.plusSeconds(5)));
        RollingStatistics result = calculator.add(new TagReading("pressure", 30, base.plusSeconds(12)));

        assertThat(result.low()).isEqualTo(20);
        assertThat(result.high()).isEqualTo(30);
        assertThat(result.mean()).isEqualTo(25);
        assertThat(result.stdDev()).isCloseTo(Math.sqrt(50), within(0.000001));
        assertThat(result.count()).isEqualTo(2);
    }

    @Test
    void evaluatesHyphenatedAlgebraicAndStandardDeviationCTags() {
        CTagEvaluator evaluator = new CTagEvaluator();
        CTag ratio = ctag("ratio", "Algebraic", "final-dis-press / suct-press",
                "final-dis-press,suct-press");
        assertThat(evaluator.evaluate(ratio, Map.of("final-dis-press", 180.0, "suct-press", 60.0)))
                .hasValue(3.0);

        CTag deviation = ctag("dev", "Standard Deviation", null, "a,b,c");
        assertThat(evaluator.evaluate(deviation, Map.of("a", 1.0, "b", 2.0, "c", 3.0)))
                .hasValue(1.0);
    }

    @Test
    void schedulerMapsNativeKeysToCodesAndPersistsComputedCTags() {
        TagRepository tags = Mockito.mock(TagRepository.class);
        CTagRepository ctags = Mockito.mock(CTagRepository.class);
        RTruthConnector rtruth = Mockito.mock(RTruthConnector.class);
        LocalInfluxStore local = Mockito.mock(LocalInfluxStore.class);
        Instant time = Instant.parse("2026-07-04T12:00:00Z");

        Tag suction = connectedTag("suct-press", "Suction Pressure");
        Tag discharge = connectedTag("final-dis-press", "Final Discharge Pressure");
        CTag ratio = ctag("compression-ratio", "Algebraic",
                "final-dis-press / suct-press", "final-dis-press,suct-press");
        ratio.setAsset(suction.getDatasource().getMachine().getAsset());
        when(tags.findAll()).thenReturn(List.of(suction, discharge));
        when(ctags.findAll()).thenReturn(List.of(ratio));
        when(rtruth.getLatest("Suction Pressure"))
                .thenReturn(java.util.Optional.of(new TagReading("Suction Pressure", 60, time)));
        when(rtruth.getLatest("Final Discharge Pressure"))
                .thenReturn(java.util.Optional.of(new TagReading("Final Discharge Pressure", 180, time)));

        StageOneScheduler scheduler = new StageOneScheduler(tags, ctags, rtruth, local,
                new CTagEvaluator(), new RollingStatisticsCalculator(Duration.ofMinutes(15)));
        scheduler.ingest();

        ArgumentCaptor<TagReading> readings = ArgumentCaptor.forClass(TagReading.class);
        verify(local, Mockito.times(3)).writePoint(readings.capture(), any(RollingStatistics.class));
        assertThat(readings.getAllValues()).extracting(TagReading::tagKey)
                .containsExactly("suct-press", "final-dis-press", "compression-ratio");
        assertThat(readings.getAllValues().get(2).value()).isEqualTo(3.0);
    }

    private static Tag connectedTag(String code, String nativeKey) {
        Asset asset = new Asset();
        asset.setCode("asset");
        asset.setAssetName("Asset");
        asset.setEnabled(true);
        Machine machine = new Machine();
        machine.setAsset(asset);
        Datasource datasource = new Datasource();
        datasource.setMachine(machine);
        Tag tag = new Tag();
        tag.setCode(code);
        tag.setTagKey(nativeKey);
        tag.setDatasource(datasource);
        return tag;
    }

    private static CTag ctag(String code, String type, String expression, String sources) {
        CTag ctag = new CTag();
        ctag.setCode(code);
        ctag.setCalculationType(type);
        ctag.setExpression(expression);
        ctag.setSourceTagIds(sources);
        return ctag;
    }

    private static org.assertj.core.data.Offset<Double> within(double value) {
        return org.assertj.core.data.Offset.offset(value);
    }
}
