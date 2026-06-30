import { ActionModal } from "./ActionModal.js";
import { data } from "../../data/index.js";
import { escapeHtml, formatNumber } from "../../lib/format.js";

export const TrendChart = {
  props: {
    title: String,
    times: { type: Array, default: () => [] },
    series: { type: Array, default: () => [] },
    selected: { type: Array, default: () => [] },
    height: { type: String, default: "360px" },
    showLegend: { type: Boolean, default: true },
    showSymbols: { type: Boolean, default: false },
    smooth: { type: Boolean, default: true },
    showDataZoom: { type: Boolean, default: true },
    gridTop: { type: Number, default: 58 },
    gridBottom: { type: Number, default: 36 },
    yMin: { type: Number, default: null },
    yMax: { type: Number, default: null },
    yInterval: { type: Number, default: null },
  },
  template: `
    <div class="trend-surface" :style="{ height }">
      <div ref="chartEl" class="trend-chart"></div>
      <div v-if="chartNotice" class="trend-notice">{{ chartNotice }}</div>
    </div>
  `,
  data() {
    return {
      chart: null,
      chartNotice: "",
    };
  },
  computed: {
    visibleSeries() {
      if (!this.selected.length) return this.series;
      return this.series.filter((item) => this.selected.includes(item.name));
    },
  },
  mounted() {
    this.mountChart();
    window.addEventListener("resize", this.resize);
    window.addEventListener("rpulse-theme-change", this.renderChart);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("rpulse-theme-change", this.renderChart);
    if (this.chart) this.chart.dispose();
  },
  watch: {
    title: "renderChart",
    selected: { handler: "renderChart", deep: true },
    times: { handler: "renderChart", deep: true },
    series: { handler: "renderChart", deep: true },
    showLegend: "renderChart",
    showSymbols: "renderChart",
    smooth: "renderChart",
    showDataZoom: "renderChart",
  },
  methods: {
    mountChart() {
      if (!window.echarts) {
        this.chartNotice = "ECharts is required for chart display.";
        return;
      }
      if (!this.$refs.chartEl) return;
      this.chartNotice = "";
      this.chart = window.echarts.init(this.$refs.chartEl);
      this.renderChart();
    },
    renderChart() {
      if (!this.chart) return;
      const css = getComputedStyle(this.$refs.chartEl);
      const token = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
      const chartBg = token("--chart-bg", "#ffffff");
      const chartInk = token("--field-ink", "#263246");
      const chartAxis = token("--chart-axis", "#8e99ad");
      const chartAxisText = token("--chart-axis-text", chartInk);
      const chartGrid = token("--chart-grid", "rgba(38, 50, 70, .16)");
      const chartTooltipBg = token("--chart-tooltip-bg", "rgba(15, 23, 42, .92)");
      const chartTooltipBorder = token("--chart-tooltip-border", "rgba(148, 163, 184, .35)");
      const chartTooltipText = token("--chart-tooltip-text", "#f8fafc");
      const chartSliderBg = token("--chart-slider-bg", "#f8fafc");
      const chartSliderBorder = token("--chart-slider-border", "#d7dce6");
      const chartSliderFill = token("--chart-slider-fill", "rgba(11, 99, 229, .14)");
      const chartSliderHandle = token("--chart-slider-handle", "#ffffff");
      const chartSliderHandleBorder = token("--chart-slider-handle-border", "#0b63e5");
      const visibleSeries = this.visibleSeries;
      const axisKeys = [...new Set(visibleSeries.map((item) => item.unit || ""))];
      const usesMixedUnits = axisKeys.length > 1;
      const parsedTimes = this.times.map((value) => Date.parse(value)).filter((value) => Number.isFinite(value));
      const isTimeAxis = parsedTimes.length > 0;
      const timeSpanMs = isTimeAxis && parsedTimes.length > 1 ? parsedTimes[parsedTimes.length - 1] - parsedTimes[0] : 0;
      const isMultiDayAxis = timeSpanMs >= 48 * 60 * 60 * 1000;
      const seriesUnitByName = new Map(visibleSeries.map((item) => [item.name, item.unit || ""]));
      const tooltipDateFormatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
      const compactTimeFormatter = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
      const hourFormatter = new Intl.DateTimeFormat(undefined, { hour: "numeric" });
      const dayHourFormatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric" });
      const xAxisLabelText = (value) => {
        if (!isTimeAxis) return String(value ?? "");
        const date = new Date(value);
        if (isMultiDayAxis) return dayHourFormatter.format(date).replace(", ", "\n");
        if (timeSpanMs >= 12 * 60 * 60 * 1000) return hourFormatter.format(date);
        return compactTimeFormatter.format(date);
      };
      const valueText = (value, unit) => {
        const number = Number(value);
        if (!Number.isFinite(number)) return String(value ?? "");
        const decimals = unit === "RPM" || unit === "Min" || unit === "state" ? 0 : Math.abs(number) < 10 ? 2 : 1;
        return `${formatNumber(number, decimals)}${unit ? ` ${unit}` : ""}`;
      };
      const hasTitle = Boolean(this.title);
      const legendTop = hasTitle ? 38 : 12;
      const resolvedGridTop = Math.max(
        this.gridTop,
        hasTitle && this.showLegend ? 86 : hasTitle ? 62 : this.showLegend ? 54 : 28
      );
      const resolvedGridBottom = this.showDataZoom ? Math.max(this.gridBottom, isMultiDayAxis ? 88 : 72) : this.gridBottom;
      const yAxes = axisKeys.map((unit, index) => ({
        type: "value",
        name: unit,
        nameGap: 12,
        nameTextStyle: { color: chartAxisText, fontSize: 10, fontWeight: 600 },
        position: usesMixedUnits && index > 0 ? "right" : "left",
        offset: usesMixedUnits && index > 1 ? (index - 1) * 54 : 0,
        min: this.yMin ?? undefined,
        max: this.yMax ?? undefined,
        interval: this.yInterval ?? undefined,
        scale: this.yMin === null && this.yMax === null,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: chartAxis } },
        splitLine: { show: index === 0, lineStyle: { color: chartGrid, type: "dashed" } },
        axisLabel: { color: chartAxisText },
      }));
      this.chart.setOption({
        animation: false,
        backgroundColor: chartBg,
        color: visibleSeries.map((item) => item.color),
        textStyle: { fontFamily: "Inter, Segoe UI, Arial, sans-serif", color: chartInk },
        title: {
          show: Boolean(this.title),
          text: this.title,
          left: 16,
          top: 12,
          textStyle: { color: chartInk, fontSize: 14, fontWeight: 600 },
        },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "cross", lineStyle: { color: chartAxis, width: 1, type: "dashed" } },
          backgroundColor: chartTooltipBg,
          borderColor: chartTooltipBorder,
          textStyle: { color: chartTooltipText, fontSize: 12 },
          extraCssText: "box-shadow: 0 12px 30px rgba(15, 23, 42, .22);",
          formatter: (params) => {
            const rows = Array.isArray(params) ? params : [params];
            const axisValue = rows[0]?.axisValue ?? (Array.isArray(rows[0]?.value) ? rows[0].value[0] : rows[0]?.value);
            const heading = isTimeAxis && Number.isFinite(Date.parse(axisValue))
              ? tooltipDateFormatter.format(new Date(axisValue))
              : String(axisValue ?? "");
            const body = rows
              .map((param) => {
                const rawValue = Array.isArray(param.value) ? param.value[1] : param.value;
                const unit = seriesUnitByName.get(param.seriesName) || "";
                return `<div class="chart-tooltip-row">${param.marker}<span>${escapeHtml(param.seriesName)}</span><strong>${escapeHtml(valueText(rawValue, unit))}</strong></div>`;
              })
              .join("");
            return `<div class="chart-tooltip-title">${escapeHtml(heading)}</div>${body}`;
          },
        },
        legend: {
          show: this.showLegend,
          type: "scroll",
          top: legendTop,
          left: 16,
          right: 16,
          height: 28,
          itemWidth: 18,
          itemHeight: 9,
          pageIconSize: 10,
          textStyle: { color: chartAxisText, fontSize: 11 },
          pageTextStyle: { color: chartAxisText, fontSize: 10 },
          selectedMode: "multiple",
        },
        grid: {
          left: 58,
          right: usesMixedUnits ? 78 + Math.max(0, axisKeys.length - 2) * 54 : 24,
          top: resolvedGridTop,
          bottom: resolvedGridBottom,
        },
        xAxis: {
          type: isTimeAxis ? "time" : "category",
          data: isTimeAxis ? undefined : this.times,
          min: isTimeAxis ? parsedTimes[0] : undefined,
          max: isTimeAxis ? parsedTimes[parsedTimes.length - 1] : undefined,
          splitNumber: isTimeAxis ? (isMultiDayAxis ? 5 : 7) : undefined,
          minInterval: isTimeAxis ? (isMultiDayAxis ? 6 * 60 * 60 * 1000 : 30 * 60 * 1000) : undefined,
          boundaryGap: false,
          axisTick: { show: false },
          axisLine: { lineStyle: { color: chartAxis } },
          axisLabel: {
            color: chartAxisText,
            fontSize: 10,
            lineHeight: 14,
            margin: 10,
            hideOverlap: true,
            formatter: isTimeAxis ? xAxisLabelText : undefined,
          },
          splitLine: { show: true, lineStyle: { color: chartGrid, type: "dashed" } },
        },
        yAxis: yAxes.length ? yAxes : [{
          type: "value",
          scale: true,
          axisTick: { show: false },
          axisLine: { lineStyle: { color: chartAxis } },
          splitLine: { lineStyle: { color: chartGrid, type: "dashed" } },
          axisLabel: { color: chartAxisText },
        }],
        dataZoom: this.showDataZoom
          ? [
              {
                type: "inside",
                xAxisIndex: 0,
                filterMode: "none",
                zoomOnMouseWheel: true,
                moveOnMouseMove: false,
                moveOnMouseWheel: true,
                throttle: 16,
              },
              {
                type: "slider",
                xAxisIndex: 0,
                filterMode: "none",
                bottom: 14,
                height: 28,
                showDetail: false,
                borderColor: chartSliderBorder,
                fillerColor: chartSliderFill,
                backgroundColor: chartSliderBg,
                dataBackground: {
                  lineStyle: { color: chartAxis },
                  areaStyle: { color: "rgba(148, 163, 184, .18)" },
                },
                selectedDataBackground: { areaStyle: { color: chartSliderFill } },
                handleStyle: { color: chartSliderHandle, borderColor: chartSliderHandleBorder },
                moveHandleStyle: { color: chartSliderHandleBorder, opacity: 0.3 },
              },
            ]
          : [],
        series: visibleSeries.map((item) => {
          const lineData = isTimeAxis ? item.data.map((value, index) => [this.times[index], value]) : item.data;
          return {
            name: item.name,
            type: "line",
            yAxisIndex: Math.max(0, axisKeys.indexOf(item.unit || "")),
            smooth: item.baselineLine ? false : (item.smooth ?? this.smooth),
            showSymbol: item.baselineLine ? false : (item.showSymbol ?? this.showSymbols),
            symbol: item.baselineLine ? "none" : "circle",
            symbolSize: 7,
            sampling: isTimeAxis ? "lttb" : undefined,
            data: lineData,
            lineStyle: {
              width: item.width ?? (item.baselineLine ? 2 : 2.2),
              type: item.lineType || "solid",
              opacity: item.opacity ?? 1,
            },
            itemStyle: { color: item.color },
            markLine: item.markLines?.length
              ? {
                  symbol: ["none", "none"],
                  silent: true,
                  label: { color: chartAxisText, fontSize: 10, formatter: "{b}" },
                  lineStyle: { color: chartAxis, width: 1.4, type: "solid" },
                  data: item.markLines.map((line) => ({
                    name: line.name,
                    xAxis: line.xAxis,
                    lineStyle: { color: line.color || chartAxis, type: line.lineType || "solid", width: line.width || 1.4 },
                    label: { formatter: line.label || line.name, color: line.color || chartAxisText },
                  })),
                }
              : undefined,
            markArea: item.markAreas?.length
              ? {
                  silent: true,
                  label: { show: false },
                  itemStyle: { color: item.markAreaColor || "rgba(194, 65, 12, 0.12)" },
                  data: item.markAreas.map((area) => [
                    { name: area.name || "Out of Baseline", xAxis: area.start },
                    { xAxis: area.end },
                  ]),
                }
              : undefined,
          };
        }),
      }, true);
    },
    resize() {
      if (this.chart) this.chart.resize();
    },
  },
};

// ActionModal covers the workflow states that branch from tables without
// adding extra shell navigation entries: assign, notify, acknowledge/track.
