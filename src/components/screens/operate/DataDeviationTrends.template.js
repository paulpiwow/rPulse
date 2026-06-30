export const template = `
    <div class="screen">
      <screen-header
        title="Maintenance Warning Trend"
        subtitle="Measured tag data against calculated baseline envelope"
        status="yellow"
        :actions="[{ key: 'export-report', label: 'Export Report', kind: 'primary' }]"
        @action="handleHeaderAction"
      />
      <div v-if="toast" class="inline-alert success">{{ toast }}</div>
      <div class="chart-control-row">
        <duration-input
          v-model="durationInput"
          :options="durationOptions"
          list-id="deviation-duration-options"
          @commit="normalizeDurationInput"
        />
      </div>
      <trend-chart
        :title="plotTitle"
        :times="currentTrend.times"
        :series="currentTrend.series"
        height="480px"
        :show-symbols="true"
      />
      <section class="panel baseline-relationship-panel">
        <div class="panel-header">
          <h2>Baseline Relationship</h2>
          <span class="panel-note">Pre-alarm maintenance warning context</span>
        </div>
        <div class="relationship-summary-grid">
          <div v-for="item in preAlarmSummary" :key="item.label">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
        <trend-chart
          title="Baseline Relationship: Maintenance Warning to Alarm Trip"
          :times="relationshipTrend.times"
          :series="relationshipTrend.series"
          height="380px"
          :show-symbols="false"
          :grid-top="96"
        />
        <div class="relationship-timeline">
          <div class="relationship-timeline-rail">
            <span
              v-for="segment in relationshipTimeline"
              :key="segment.label"
              :class="['relationship-segment', segment.kind]"
              :style="{ flexGrow: segment.weight }"
            ></span>
          </div>
          <div class="relationship-timeline-labels">
            <span v-for="segment in relationshipTimeline" :key="segment.label + '-label'">{{ segment.label }}</span>
          </div>
        </div>
      </section>
      <section class="panel prealarm-analysis-panel">
        <div class="panel-header">
          <h2>Pre-Alarm Baseline Analysis</h2>
        </div>
        <p class="prealarm-narrative">{{ preAlarmNarrative }}</p>
        <div class="prealarm-event-list">
          <div v-if="!preAlarmEvents.length" class="prealarm-empty">No out-of-baseline events were detected before the mapped alarm in this window.</div>
          <div v-for="event in preAlarmEvents" :key="event.id" class="prealarm-event-row">
            <strong>{{ event.label }}</strong>
            <span>{{ event.startLabel }}</span>
            <span>{{ event.durationLabel }}</span>
            <span>{{ event.peakLabel }}</span>
          </div>
        </div>
      </section>
      <section class="panel deviation-report-panel">
        <div class="panel-header">
          <h2>Maintenance Warning Report</h2>
        </div>
        <div class="deviation-report-grid">
          <div v-for="item in deviationReport" :key="item.label">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
      </section>
      <export-format-modal
        :open="exportModalOpen"
        title="Export Maintenance Warning Trend"
        @close="exportModalOpen = false"
        @select="handleExportFormat"
      />
    </div>
`;
