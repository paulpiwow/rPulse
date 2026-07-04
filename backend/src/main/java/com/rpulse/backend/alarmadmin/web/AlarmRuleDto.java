package com.rpulse.backend.alarmadmin.web;

import java.math.BigDecimal;
import java.util.List;

import com.rpulse.backend.alarmadmin.entity.WatchedKind;

/**
 * The shape of an alarm as it travels over the web, to and from the Alarm
 * Configuration screen.
 *
 * <p>Why this exists: the stored alarm record links to whole groups and whole people
 * it should notify. Sending all of those full records back and forth would be heavy
 * and awkward. So instead this "travel form" of an alarm carries just the business
 * codes of the groups and people to notify ({@code notifyGroupCodes} /
 * {@code notifyUserCodes}). The controller turns this form into a real alarm record
 * (looking up those codes) when saving, and turns a real alarm record back into this
 * form when sending.
 *
 * <p>Per the API contract, everything here is cross-referenced by business
 * <em>code</em> (the same addressing the hierarchy endpoints use), never by database
 * id: the parent asset is {@code assetCode}, and the watched series is
 * {@code watchedTagCode} plus {@code watchedKind} saying whether that code names a
 * measured tag or a computed one.
 *
 * <p>It's written as a "record", which is simply a compact way to declare a plain
 * data holder — each name below is one field.
 */
public record AlarmRuleDto(
    String code,
    String assetCode,
    String alarmName,
    String alarmType,
    boolean enabled,
    String severity,
    String watchedTagCode,
    WatchedKind watchedKind,
    String operator,
    BigDecimal thresholdValue,
    BigDecimal rateValue,
    String rateUnit,
    String ratePeriod,
    String logicFormula,
    List<String> notifyGroupCodes,
    List<String> notifyUserCodes
) {
}
