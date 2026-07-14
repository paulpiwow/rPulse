package com.rpulse.backend.maintenance.engine;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rpulse.backend.hierarchy.entity.Baseline;
import com.rpulse.backend.hierarchy.repository.BaselineRepository;
import com.rpulse.backend.influx.LocalInfluxStore;
import com.rpulse.backend.influx.TagReading;
import com.rpulse.backend.maintenance.entity.MaintenanceWarningHistory;
import com.rpulse.backend.maintenance.repository.MaintenanceWarningHistoryRepository;

/**
 * The maintenance-warning engine — a Stage 2 sibling of the alarm engine. Where the
 * alarm engine watches user-defined rules, this one watches {@link Baseline}s: for
 * each enabled baseline it compares the tag's current reading against what "normal"
 * looks like, and it fires a warning when the reading drifts outside that normal
 * range.
 *
 * <p><b>Keep the two ideas separate.</b> Alarms come from rules a person sets up;
 * maintenance warnings come from a tag straying from its own baseline. They live in
 * different tables and never share logic, on purpose — mixing "someone asked to be
 * warned" with "this reading looks abnormal" is exactly the confusion we're avoiding.
 *
 * <p><b>What counts as a drift.</b> A baseline carries four numbers: a low bound, a
 * high bound, an average (target), and a standard deviation (how much the tag
 * normally wiggles). A reading is "outside" when it falls under the low bound or over
 * the high bound (the RANGE check), or when it is more than N standard deviations away
 * from the average (the STDDEV check). N and which checks to apply are configurable —
 * see the properties near the top of this class.
 *
 * <p><b>Where the values come from.</b> Like the alarm engine, this reads current
 * values from rPulse's own Stage-2 store through the {@link LocalInfluxStore}
 * interface. Whether that store is backed by the mock, rPulse's local Influx, or
 * rTruth's skid bucket is decided elsewhere (by configuration and Marshall's store
 * layer); this engine neither knows nor cares.
 *
 * <p><b>One row per drift, not per tick.</b> Just like the alarm engine, an in-memory
 * map ({@link #firingByBaseline}, baseline id → the open warning row's id) remembers
 * which baselines are already drifting, so a drift that lasts ten evaluation cycles
 * still writes a single row. That row's {@code duration_seconds} is refreshed every
 * cycle while the drift continues and finalised when the reading returns to normal.
 * After a restart the map starts empty, so {@link #openFor} re-adopts any still-open
 * row from the database on first sight of the baseline — no duplicate is written.
 *
 * <p><b>No messages here.</b> Unlike an alarm, a maintenance warning never sends a
 * notification on its own. It only records the drift; a message is produced only when
 * an operator explicitly hits "Notify" on the warnings screen (handled elsewhere).
 */
@Service
public class MaintenanceWarningEngine {

    static final String ACTIVE = "ACTIVE";
    static final String CLEARED = "CLEARED";
    private static final List<String> OPEN_STATUSES = List.of(ACTIVE);

    // Which bounds to check for a drift.
    private static final String MODE_RANGE = "RANGE";     // low/high only
    private static final String MODE_STDDEV = "STDDEV";   // mean +/- N*std only
    // (anything else, including the default "EITHER", checks both)

    private static final String ABOVE = "ABOVE";
    private static final String BELOW = "BELOW";

    private final BaselineRepository baselineRepo;
    private final MaintenanceWarningHistoryRepository warningRepo;
    private final LocalInfluxStore localStore;

    /**
     * How many standard deviations away from the average still counts as normal —
     * the N in "mean plus or minus N standard deviations". Defaults to 3, the usual
     * "three-sigma" choice.
     */
    private final double stdDevMultiplier;

    /** RANGE, STDDEV, or EITHER (the default) — which bounds a drift is measured against. */
    private final String mode;

    /** baseline id → id of the open maintenance_warning_history row currently drifting. */
    private final Map<Long, Long> firingByBaseline = new ConcurrentHashMap<>();
    private final ReentrantLock lock = new ReentrantLock();

    public MaintenanceWarningEngine(
            BaselineRepository baselineRepo,
            MaintenanceWarningHistoryRepository warningRepo,
            LocalInfluxStore localStore,
            @Value("${rpulse.maintenance.std-dev-multiplier:3}") double stdDevMultiplier,
            @Value("${rpulse.maintenance.mode:EITHER}") String mode) {
        this.baselineRepo = baselineRepo;
        this.warningRepo = warningRepo;
        this.localStore = localStore;
        this.stdDevMultiplier = stdDevMultiplier;
        this.mode = mode == null ? "EITHER" : mode.trim().toUpperCase();
    }

    /** Scheduled entry point — runs the same evaluation as the on-demand path. */
    @Scheduled(fixedRateString = "${rpulse.maintenance.evaluate-interval-ms:10000}")
    @Transactional
    public void scheduledEvaluate() {
        evaluate();
    }

    /**
     * Evaluate every enabled baseline once. Writes/updates warning rows as drifts
     * start, continue, and end, and returns the warnings currently active (still
     * drifting). Safe to call alongside the scheduled job — a lock serialises the two
     * so the in-memory firing map stays consistent.
     */
    @Transactional
    public List<MaintenanceWarningHistory> evaluate() {
        lock.lock();
        try {
            // Only baselines that are switched on and point at a concrete series (a Tag
            // or CTag) can be evaluated; Asset-scope baselines have no single reading.
            List<Baseline> targeted = baselineRepo.findAll().stream()
                    .filter(Baseline::isEnabled)
                    .filter(b -> seriesKey(b) != null)
                    .toList();

            // Fetch every needed reading in one batched call, like the alarm engine does.
            Set<String> keys = new HashSet<>();
            for (Baseline b : targeted) {
                keys.add(seriesKey(b));
            }
            Map<String, TagReading> readings = keys.isEmpty() ? Map.of() : localStore.getLatest(keys);

            List<MaintenanceWarningHistory> active = new ArrayList<>();
            for (Baseline b : targeted) {
                TagReading reading = readings.get(seriesKey(b));
                if (reading == null) {
                    continue;   // no current value for this series — nothing to judge
                }
                double value = reading.value();
                MaintenanceWarningHistory open = openFor(b.getId());
                Breach breach = breachFor(b, value);
                if (breach != null) {
                    if (open == null) {
                        open = onNewWarning(b, value, breach);
                    } else {
                        refreshDuration(open);
                    }
                    active.add(open);
                } else if (open != null) {
                    autoClear(b.getId(), open);
                }
            }
            return active;
        } finally {
            lock.unlock();
        }
    }

    // -----------------------------------------------------------------------
    // Transition helpers (mirrors of the alarm engine's fire / refresh / clear)
    // -----------------------------------------------------------------------

    /** The open warning row for a baseline, adopting a still-open row from the DB after a restart. */
    private MaintenanceWarningHistory openFor(Long baselineId) {
        Long warningId = firingByBaseline.get(baselineId);
        if (warningId != null) {
            MaintenanceWarningHistory mapped = warningRepo.findById(warningId).orElse(null);
            if (mapped != null && !CLEARED.equals(mapped.getStatus())) {
                return mapped;
            }
            firingByBaseline.remove(baselineId);
        }
        MaintenanceWarningHistory adopted = warningRepo
                .findFirstByBaseline_IdAndStatusInOrderByTripTimeDesc(baselineId, OPEN_STATUSES)
                .orElse(null);
        if (adopted != null) {
            firingByBaseline.put(baselineId, adopted.getId());
        }
        return adopted;
    }

    /** A baseline just started drifting: write the warning row (status ACTIVE) and remember it. */
    private MaintenanceWarningHistory onNewWarning(Baseline baseline, double value, Breach breach) {
        OffsetDateTime now = OffsetDateTime.now();
        MaintenanceWarningHistory warning = new MaintenanceWarningHistory();
        warning.setCode("MWH-" + UUID.randomUUID());
        warning.setBaseline(baseline);
        warning.setAssetId(baseline.getAsset() != null ? baseline.getAsset().getId() : null);
        warning.setTagCode(seriesKey(baseline));
        warning.setScope(baseline.getScope());
        warning.setObservedValue(BigDecimal.valueOf(value));
        warning.setBaselineLow(baseline.getBaselineLow());
        warning.setBaselineHigh(baseline.getBaselineHigh());
        warning.setBaselineTarget(baseline.getBaselineTarget());
        warning.setBaselineStdDev(baseline.getBaselineStdDev());
        warning.setStdDevMultiplier(BigDecimal.valueOf(stdDevMultiplier));
        warning.setDirection(breach.direction());
        warning.setBasis(breach.basis());
        warning.setOwner(baseline.getOwner());
        warning.setTripTime(now);
        warning.setDurationSeconds(0);
        warning.setStatus(ACTIVE);
        MaintenanceWarningHistory saved = warningRepo.save(warning);
        firingByBaseline.put(baseline.getId(), saved.getId());
        return saved;
    }

    /** Still drifting: keep duration_seconds current. */
    private void refreshDuration(MaintenanceWarningHistory warning) {
        if (warning.getTripTime() != null) {
            long seconds = Duration.between(warning.getTripTime(), OffsetDateTime.now()).getSeconds();
            warning.setDurationSeconds((int) seconds);
            warningRepo.save(warning);
        }
    }

    /** Reading returned to normal: finalise the duration and clear the warning. */
    private void autoClear(Long baselineId, MaintenanceWarningHistory warning) {
        OffsetDateTime now = OffsetDateTime.now();
        warning.setClearTime(now);
        if (warning.getTripTime() != null) {
            warning.setDurationSeconds((int) Duration.between(warning.getTripTime(), now).getSeconds());
        }
        warning.setStatus(CLEARED);
        warningRepo.save(warning);
        firingByBaseline.remove(baselineId);
    }

    // -----------------------------------------------------------------------
    // The deviation check — the one piece that is genuinely maintenance-specific
    // -----------------------------------------------------------------------

    /**
     * Decide whether a reading is outside its baseline, and if so, describe how.
     * Returns null when the reading is within every bound that applies.
     *
     * <p>Two independent checks, either of which can trip depending on {@link #mode}:
     * <ul>
     *   <li><b>RANGE</b> — the reading is below the low bound or above the high bound.</li>
     *   <li><b>STDDEV</b> — the reading is more than N standard deviations from the
     *       average (below {@code mean - N*std} or above {@code mean + N*std}).</li>
     * </ul>
     * Each individual comparison is skipped when the numbers it needs are missing, so
     * a half-filled baseline simply checks whatever it can.
     */
    private Breach breachFor(Baseline b, double value) {
        boolean checkRange = !MODE_STDDEV.equals(mode);
        boolean checkStd = !MODE_RANGE.equals(mode);

        boolean rangeLow = checkRange && b.getBaselineLow() != null && value < b.getBaselineLow().doubleValue();
        boolean rangeHigh = checkRange && b.getBaselineHigh() != null && value > b.getBaselineHigh().doubleValue();

        boolean stdLow = false;
        boolean stdHigh = false;
        if (checkStd && b.getBaselineTarget() != null && b.getBaselineStdDev() != null) {
            double mean = b.getBaselineTarget().doubleValue();
            double band = stdDevMultiplier * b.getBaselineStdDev().doubleValue();
            stdLow = value < mean - band;
            stdHigh = value > mean + band;
        }

        boolean rangeBreach = rangeLow || rangeHigh;
        boolean stdBreach = stdLow || stdHigh;
        if (!rangeBreach && !stdBreach) {
            return null;   // inside every bound that applies — not a warning
        }

        String direction = (rangeHigh || stdHigh) ? ABOVE : BELOW;
        String basis = rangeBreach && stdBreach ? "BOTH" : (rangeBreach ? MODE_RANGE : MODE_STDDEV);
        return new Breach(direction, basis);
    }

    /** The Influx series key for a baseline's target, or null for Asset-scope baselines. */
    private static String seriesKey(Baseline b) {
        if ("Tag".equalsIgnoreCase(b.getScope()) && b.getTag() != null) {
            return b.getTag().getCode();
        }
        if ("CTag".equalsIgnoreCase(b.getScope()) && b.getCtag() != null) {
            return b.getCtag().getCode();
        }
        return null;
    }

    /** A small answer object: which way the reading strayed, and which bound it broke. */
    private record Breach(String direction, String basis) {
    }
}
