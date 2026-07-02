package com.rpulse.backend.alarmadmin.engine;

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
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import com.rpulse.backend.alarmadmin.entity.AlarmHistory;
import com.rpulse.backend.alarmadmin.entity.AlarmRule;
import com.rpulse.backend.alarmadmin.entity.SystemMessage;
import com.rpulse.backend.alarmadmin.entity.WatchedKind;
import com.rpulse.backend.alarmadmin.repository.AlarmHistoryRepository;
import com.rpulse.backend.alarmadmin.repository.AlarmRuleRepository;
import com.rpulse.backend.alarmadmin.repository.AppUserRepository;
import com.rpulse.backend.alarmadmin.repository.SystemMessageRepository;
import com.rpulse.backend.hierarchy.entity.Tag;
import com.rpulse.backend.hierarchy.repository.CTagRepository;
import com.rpulse.backend.hierarchy.repository.TagRepository;
import com.rpulse.backend.influx.LocalInfluxStore;
import com.rpulse.backend.influx.TagReading;

/**
 * Deterministic behaviour test for {@link AlarmEngineService}. The repositories are mocked
 * (backed by in-memory maps so ids/codes round-trip) and the local Influx store is a
 * hand-controlled {@link FakeLocalStore}, so the alarm lifecycle can be driven exactly and
 * asserted without a database or a live feed. This is also what proves the "on-demand" entry
 * point ({@link AlarmEngineService#evaluate()}) and the scheduled entry point run the same logic.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AlarmEngineServiceTest {

    private static final String TAG_KEY = "suct-press";

    @Mock AlarmRuleRepository ruleRepo;
    @Mock AlarmHistoryRepository historyRepo;
    @Mock SystemMessageRepository messageRepo;
    @Mock AppUserRepository userRepo;
    @Mock TagRepository tagRepo;
    @Mock CTagRepository ctagRepo;

    private final FakeLocalStore localStore = new FakeLocalStore();
    private final Map<Long, AlarmHistory> historyById = new HashMap<>();
    private final Map<String, AlarmHistory> historyByCode = new HashMap<>();
    private final AtomicLong historySeq = new AtomicLong(1);

    private AlarmEngineService engine;

    @BeforeEach
    void setUp() {
        engine = new AlarmEngineService(ruleRepo, historyRepo, messageRepo, userRepo, tagRepo, ctagRepo, localStore);
        when(userRepo.existsById(anyLong())).thenReturn(true);   // acting users exist in these tests

        // An in-memory stand-in for the alarm_history table so save/find round-trip like the real repo.
        when(historyRepo.save(any(AlarmHistory.class))).thenAnswer(inv -> {
            AlarmHistory h = inv.getArgument(0);
            if (h.getId() == null) {
                ReflectionTestUtils.setField(h, "id", historySeq.getAndIncrement());
            }
            historyById.put(h.getId(), h);
            historyByCode.put(h.getCode(), h);
            return h;
        });
        when(historyRepo.findById(anyLong()))
                .thenAnswer(inv -> Optional.ofNullable(historyById.get(inv.getArgument(0))));
        when(historyRepo.findByCode(anyString()))
                .thenAnswer(inv -> Optional.ofNullable(historyByCode.get(inv.getArgument(0))));
        when(historyRepo.findFirstByAlarmRule_IdAndStatusInOrderByTripTimeDesc(anyLong(), any()))
                .thenReturn(Optional.empty());

        Tag tag = new Tag();
        tag.setCode(TAG_KEY);
        when(tagRepo.findById(1L)).thenReturn(Optional.of(tag));
    }

    @Test
    void newFire_writesActiveHistoryAndAlarmMessage_andReturnsLiveView() {
        when(ruleRepo.findByEnabledTrue()).thenReturn(List.of(rule()));
        localStore.values.put(TAG_KEY, 150.0);      // 150 > 100 threshold -> firing

        List<ActiveAlarm> firing = engine.evaluate();

        assertThat(firing).hasSize(1);
        ActiveAlarm view = firing.get(0);
        assertThat(view.status()).isEqualTo("ACTIVE");
        assertThat(view.alarmId()).isEqualTo("ALM-1");
        assertThat(view.currentValue()).isEqualTo(150.0);
        assertThat(view.operator()).isEqualTo("GT");        // stored '>' mapped to spec token

        assertThat(historyByCode).hasSize(1);
        assertThat(historyByCode.values().iterator().next().getStatus()).isEqualTo("ACTIVE");

        SystemMessage msg = captureLastMessage();
        assertThat(msg.getSource()).isEqualTo("ALARM");
    }

    @Test
    void evaluate_fetchesAllTagsInOneRoundTrip() {
        when(ruleRepo.findByEnabledTrue()).thenReturn(List.of(rule()));
        localStore.values.put(TAG_KEY, 150.0);

        engine.evaluate();

        assertThat(localStore.getLatestManyCalls).isEqualTo(1);
    }

    @Test
    void acknowledge_movesActiveToAcked_keepsFiring_andEmitsAlarmStatus() {
        when(ruleRepo.findByEnabledTrue()).thenReturn(List.of(rule()));
        localStore.values.put(TAG_KEY, 150.0);
        String historyCode = engine.evaluate().get(0).historyId();

        Optional<AlarmHistory> acked = engine.acknowledge(historyCode, 7L);

        assertThat(acked).isPresent();
        assertThat(acked.get().getStatus()).isEqualTo("ACKED");
        assertThat(acked.get().getAcknowledgedByUserId()).isEqualTo(7L);
        assertThat(acked.get().getAcknowledgeTime()).isNotNull();
        assertThat(captureLastMessage().getSource()).isEqualTo("ALARM_STATUS");
    }

    @Test
    void acknowledge_withUnknownUser_succeedsAndRecordsNoUser() {
        when(ruleRepo.findByEnabledTrue()).thenReturn(List.of(rule()));
        when(userRepo.existsById(anyLong())).thenReturn(false);   // acting user id is not a real app_user
        localStore.values.put(TAG_KEY, 150.0);
        String historyCode = engine.evaluate().get(0).historyId();

        Optional<AlarmHistory> acked = engine.acknowledge(historyCode, 999L);

        assertThat(acked).isPresent();
        assertThat(acked.get().getStatus()).isEqualTo("ACKED");
        assertThat(acked.get().getAcknowledgedByUserId()).isNull();   // dropped rather than a bad FK
    }

    @Test
    void clear_finalisesDurationAndClears_andEmitsAlarmStatus() {
        when(ruleRepo.findByEnabledTrue()).thenReturn(List.of(rule()));
        localStore.values.put(TAG_KEY, 150.0);
        AlarmHistory open = historyForCode(engine.evaluate().get(0).historyId());
        // Backdate the trip so a finalised duration is clearly non-zero.
        open.setTripTime(open.getTripTime().minusSeconds(30));

        Optional<AlarmHistory> cleared = engine.clear(open.getCode(), 9L);

        assertThat(cleared).isPresent();
        assertThat(cleared.get().getStatus()).isEqualTo("CLEARED");
        assertThat(cleared.get().getClearedByUserId()).isEqualTo(9L);
        assertThat(cleared.get().getClearTime()).isNotNull();
        assertThat(cleared.get().getDurationSeconds()).isGreaterThanOrEqualTo(30);
        assertThat(captureLastMessage().getSource()).isEqualTo("ALARM_STATUS");
    }

    @Test
    void evaluate_autoClearsWhenReadingReturnsToNormal() {
        when(ruleRepo.findByEnabledTrue()).thenReturn(List.of(rule()));

        localStore.values.put(TAG_KEY, 150.0);       // fire
        AlarmHistory open = historyForCode(engine.evaluate().get(0).historyId());

        localStore.values.put(TAG_KEY, 50.0);         // back to normal
        List<ActiveAlarm> firing = engine.evaluate();

        assertThat(firing).isEmpty();
        assertThat(open.getStatus()).isEqualTo("CLEARED");
        assertThat(open.getClearTime()).isNotNull();
    }

    @Test
    void scheduledEvaluate_runsTheSameEvaluation() {
        when(ruleRepo.findByEnabledTrue()).thenReturn(List.of(rule()));
        localStore.values.put(TAG_KEY, 150.0);

        engine.scheduledEvaluate();

        // Same code path: it consulted the enabled rules and wrote a history row.
        verify(ruleRepo, atLeastOnce()).findByEnabledTrue();
        assertThat(historyByCode).hasSize(1);
    }

    // -----------------------------------------------------------------------

    private AlarmRule rule() {
        AlarmRule rule = new AlarmRule();
        ReflectionTestUtils.setField(rule, "id", 1L);
        rule.setCode("ALM-1");
        rule.setAssetId(10L);
        rule.setAlarmName("Suction pressure high");
        rule.setAlarmType("Threshold");
        rule.setEnabled(true);
        rule.setSeverity("red");
        rule.setWatchedTagId(1L);
        rule.setWatchedKind(WatchedKind.TAG);
        rule.setOperator(">");
        rule.setThresholdValue(new BigDecimal("100"));
        return rule;
    }

    private AlarmHistory historyForCode(String code) {
        return historyByCode.get(code);
    }

    private SystemMessage captureLastMessage() {
        ArgumentCaptor<SystemMessage> captor = ArgumentCaptor.forClass(SystemMessage.class);
        verify(messageRepo, atLeastOnce()).save(captor.capture());
        return captor.getValue();
    }

    /** A fully controllable local Influx store: values are set by the test; counts the deduped fetches. */
    private static final class FakeLocalStore implements LocalInfluxStore {
        final Map<String, Double> values = new HashMap<>();
        int getLatestManyCalls = 0;

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
