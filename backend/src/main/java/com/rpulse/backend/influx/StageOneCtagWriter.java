package com.rpulse.backend.influx;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** Routes computed Stage-1 CTags to the configured Influx destination. */
@Service
public class StageOneCtagWriter {
    private final RTruthConnector rtruth;
    private final LocalInfluxStore localStore;
    private final StageOneCtagDestination destination;

    public StageOneCtagWriter(RTruthConnector rtruth, LocalInfluxStore localStore,
                              @Value("${rpulse.stage1.ctag-destination:local}") String destination) {
        this.rtruth = rtruth;
        this.localStore = localStore;
        this.destination = StageOneCtagDestination.from(destination);
    }

    public void writeComputedTag(TagReading reading, RollingStatistics statistics) {
        switch (destination) {
            case LOCAL -> localStore.writeComputedPoint(reading, statistics);
            case RTRUTH -> rtruth.writeComputedPoint(reading.tagKey(), reading.value(), reading.time());
        }
    }
}
