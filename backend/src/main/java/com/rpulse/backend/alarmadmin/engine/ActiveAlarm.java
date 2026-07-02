package com.rpulse.backend.alarmadmin.engine;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * One currently-firing alarm, as the Active Alarms screen shows it: the history row's
 * identity and lifecycle, plus the live reading and the rule's limit/condition so the
 * screen can render "current value vs limit value, and condition" in one shot.
 *
 * @param historyId       the alarm_history {@code code} (the external id used by ack/clear)
 * @param alarmId         the alarm_rule {@code code} that fired
 * @param assetId         the asset the alarm is on
 * @param alarmName       display name
 * @param severity        red | yellow
 * @param status          ACTIVE | ACKED (a firing alarm is one or the other)
 * @param tagKey          the tag/ctag series key being watched
 * @param currentValue    the latest reading from the local Influx store
 * @param thresholdValue  the rule's limit
 * @param operator        the condition as a spec token (GT/LT/GTE/LTE/EQ)
 * @param tripTime        when it first tripped
 * @param ackTime         when acknowledged (null until then)
 * @param durationSeconds how long it has been firing
 */
public record ActiveAlarm(
        String historyId,
        String alarmId,
        Long assetId,
        String alarmName,
        String severity,
        String status,
        String tagKey,
        Double currentValue,
        BigDecimal thresholdValue,
        String operator,
        OffsetDateTime tripTime,
        OffsetDateTime ackTime,
        Integer durationSeconds) {
}
