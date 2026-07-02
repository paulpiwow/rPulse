package com.rpulse.backend.influx;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * A stand-in {@link RTruthConnector} that fabricates realistic, moving values so the alarm
 * engine, Site Status, Maintenance Warnings and trend charts all work end-to-end before a
 * live rTruth / the Phase 5 Skid Simulator exists.
 *
 * <p>Values are a smooth sine wave whose midpoint, amplitude and period are derived from a
 * hash of the series key — so each tag looks different, the same tag reads consistently at
 * a given instant, and values genuinely rise and fall over time. That last part matters:
 * it lets alarms actually trip and auto-clear as the wave crosses a threshold, which is how
 * you exercise the engine without real data.
 *
 * <p>Active for every profile except {@code live}; the future live HTTP connector will be
 * {@code @Profile("live")}, so flipping the profile swaps the data source with no other
 * changes.
 */
@Component
@Profile("!live")
public class MockRTruthConnector implements RTruthConnector {

    /** Points written via {@link #writePoint} (e.g. computed ctags) override the synthetic wave. */
    private final Map<String, TagReading> written = new ConcurrentHashMap<>();

    /**
     * A deterministic synthetic catalog so the Connect Tags screen has HISTORIAN tags to pick
     * from before a live rTruth exists. These mirror the prototype tag ids; the {@code live}
     * connector will instead query the real historian for its series.
     */
    @Override
    public List<AvailableTag> listAvailableTags() {
        return List.of(
                new AvailableTag("suct-press", "Suction Pressure", "psi"),
                new AvailableTag("final-dis-press", "Final Discharge Pressure", "psi"),
                new AvailableTag("suct-temp", "Suction Temperature", "°F"),
                new AvailableTag("dis-temp", "Discharge Temperature", "°F"),
                new AvailableTag("motor-rpm", "Motor Speed", "rpm"),
                new AvailableTag("motor-current", "Motor Current", "A"),
                new AvailableTag("vibration", "Vibration", "mm/s"),
                new AvailableTag("flow-rate", "Flow Rate", "gpm"));
    }

    @Override
    public Optional<TagReading> getLatest(String tagKey) {
        Instant now = Instant.now();
        TagReading override = written.get(tagKey);
        if (override != null) {
            return Optional.of(override);
        }
        return Optional.of(new TagReading(tagKey, synth(tagKey, now), now));
    }

    @Override
    public Map<String, TagReading> getLatest(Collection<String> tagKeys) {
        Map<String, TagReading> out = new LinkedHashMap<>();
        for (String key : tagKeys) {
            getLatest(key).ifPresent(r -> out.put(key, r));
        }
        return out;
    }

    @Override
    public List<TrendPoint> getTrend(String tagKey, Duration window) {
        int points = 120;
        Instant end = Instant.now();
        long windowSec = Math.max(window.getSeconds(), 1);
        long stepSec = Math.max(windowSec / points, 1);
        List<TrendPoint> series = new ArrayList<>();
        for (Instant t = end.minusSeconds(windowSec); !t.isAfter(end); t = t.plusSeconds(stepSec)) {
            series.add(new TrendPoint(t, synth(tagKey, t)));
        }
        return series;
    }

    @Override
    public Aggregates getAggregates(String tagKey, Instant start, Instant end) {
        long windowSec = Math.max(Duration.between(start, end).getSeconds(), 1);
        long stepSec = Math.max(windowSec / 200, 1);
        double min = Double.POSITIVE_INFINITY;
        double max = Double.NEGATIVE_INFINITY;
        double sum = 0;
        double sumSq = 0;
        long count = 0;
        for (Instant t = start; !t.isAfter(end); t = t.plusSeconds(stepSec)) {
            double v = synth(tagKey, t);
            min = Math.min(min, v);
            max = Math.max(max, v);
            sum += v;
            sumSq += v * v;
            count++;
        }
        if (count == 0) {
            return new Aggregates(0, 0, 0, 0, 0);
        }
        double avg = sum / count;
        double variance = Math.max((sumSq / count) - (avg * avg), 0);
        return new Aggregates(min, max, avg, Math.sqrt(variance), count);
    }

    @Override
    public void writePoint(String tagKey, double value, Instant time) {
        written.put(tagKey, new TagReading(tagKey, value, time));
    }

    /**
     * A deterministic value for {@code key} at {@code t}: a sine wave whose shape is seeded
     * from the key's hash, so different tags differ but any one tag is reproducible.
     */
    private static double synth(String key, Instant t) {
        int h = Math.abs(key == null ? 0 : key.hashCode());
        double midpoint = 50 + (h % 200);        // 50 .. 249
        double amplitude = 10 + (h % 40);        // 10 .. 49
        double periodSec = 60 + (h % 240);       // 60 .. 299 seconds
        double phase = h % 360;
        double angle = (2 * Math.PI * (t.getEpochSecond() % (long) periodSec) / periodSec) + phase;
        return midpoint + amplitude * Math.sin(angle);
    }
}
