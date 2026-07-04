package com.rpulse.backend.operate;

import java.math.BigDecimal;

/**
 * One tag/ctag currently reading outside its baseline range — a maintenance deviation.
 * Maintenance warnings surface only on their screen; they do <em>not</em> write history or
 * messages unless an operator explicitly hits Notify.
 *
 * @param tagCode        the series key (tag/ctag {@code code}) that deviated
 * @param scope          the baseline scope (Tag or CTag)
 * @param assetCode      the owning asset's code
 * @param currentValue   the latest reading from rTruth
 * @param baselineLow    lower bound of the baseline range
 * @param baselineHigh   upper bound of the baseline range
 * @param baselineTarget baseline mean/target
 * @param baselineStdDev baseline standard deviation
 * @param direction      ABOVE (over high) or BELOW (under low)
 */
public record MaintenanceWarning(
        String tagCode,
        String scope,
        String assetCode,
        Double currentValue,
        BigDecimal baselineLow,
        BigDecimal baselineHigh,
        BigDecimal baselineTarget,
        BigDecimal baselineStdDev,
        String direction) {
}
