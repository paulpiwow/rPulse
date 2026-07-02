package com.rpulse.backend.influx;

import java.time.Instant;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * A stand-in {@link LocalInfluxStore} that fabricates realistic, moving values so the alarm
 * engine works end-to-end before Stage 1 of the scheduler pipeline (Marshall's) and a real
 * local Influx exist. It mirrors {@link MockRTruthConnector}'s deterministic sine wave so a
 * given series reads consistently at any instant yet genuinely rises and falls over time —
 * which is what lets alarms actually trip and auto-clear as the wave crosses a threshold.
 *
 * <p>Active for every profile except {@code live}; the future live store will be
 * {@code @Profile("live")}, so flipping the profile swaps the data source with no engine change.
 */
@Component
@Profile("!live")
public class MockLocalInfluxStore implements LocalInfluxStore {

    @Override
    public Optional<TagReading> getLatest(String tagKey) {
        Instant now = Instant.now();
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

    /**
     * A deterministic value for {@code key} at {@code t}: a sine wave whose shape is seeded from
     * the key's hash, so different tags differ but any one tag is reproducible.
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
