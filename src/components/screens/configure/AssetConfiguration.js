import { EditableTable } from "../../shared/EditableTable.js";
import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { data } from "../../../data/index.js";
import { plotDurationOptions } from "../../../lib/duration.js";
import { formatNumber } from "../../../lib/format.js";
import { assetSourceKey, readAssetTagConnections, tagCatalog } from "../../../lib/tags.js";
import { trendValuesForTag } from "../../../lib/trends.js";
import { computed, reactive, ref, useRouter } from "../../../lib/vue.js";
import { template } from "./AssetConfiguration.template.js";

export const AssetConfiguration = {
  components: { ScreenHeader, EditableTable },
  template,
  setup() {
    const rowId = (() => {
      let index = 0;
      return () => `editable-${index++}`;
    })();
    const withRowId = (row) => ({ __rowId: rowId(), ...row });
    const nextId = (prefix, rows, field) => {
      const existingIds = [
        ...data.assets.map((asset) => asset.assetId),
        ...data.machines.map((machine) => machine.machineId),
        ...data.dataSources.map((source) => source.dataSourceId),
        ...tagCatalog.map((tag) => tag.tagId),
        ...rows.map((row) => row[field]),
      ];
      const nextNumber =
        existingIds.reduce((maxNumber, id) => {
          const match = String(id || "").match(new RegExp(`^${prefix}-(\\d+)$`));
          return match ? Math.max(maxNumber, Number(match[1])) : maxNumber;
        }, 0) + 1;
      return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
    };
    const blankRow = (columns, rows = []) =>
      withRowId(
        columns.reduce((row, column) => {
          row[column.field] = column.idPrefix ? nextId(column.idPrefix, rows, column.field) : "";
          return row;
        }, {})
      );
    const rowHasValue = (row, columns) => columns.some((column) => !column.readonly && String(row[column.field] ?? "").trim());
    const updateTable = (rowsTarget, columns) => {
      const rows = Array.isArray(rowsTarget) ? rowsTarget : rowsTarget.value;
      if (!rows.length || rowHasValue(rows[rows.length - 1], columns)) {
        rows.push(blankRow(columns, rows));
      }
    };
    const assetWithSources =
      data.assets.find((asset) =>
        data.machines.some(
          (machine) =>
            machine.assetName === asset.assetName &&
            data.dataSources.some((source) => source.machineName === machine.machineName)
        )
      ) || data.assets[0];
    const selectedAssetName = assetWithSources?.assetName || "";
    const selectedMachines = data.machines.filter((machine) => machine.assetName === selectedAssetName);
    const selectedMachineNames = selectedMachines.map((machine) => machine.machineName);
    const selectedSources = data.dataSources.filter((source) => selectedMachineNames.includes(source.machineName));
    const downloadedTags = tagCatalog
      .filter((tag) => tag.kind !== "CTag")
      .map((tag) => ({
        value: tag.tagId,
        label: `${tag.tagId} - ${tag.tagName}`,
        ...tag,
      }));
    const sourceKey = assetSourceKey;
    const machineDataSourceCount = ref(2);
    const machineDataSourceFields = computed(() =>
      Array.from({ length: machineDataSourceCount.value }, (_, index) => `dataSource${index + 1}`)
    );
    const machineDataSourceActions = computed(() => [
      { key: "add-machine", label: "Add Machine" },
      ...(machineDataSourceCount.value < 5 ? [{ key: "add-data-source", label: "Add Data Source Column" }] : []),
    ]);
    const machineOptions = computed(() =>
      machineRows.value
        .filter((machine) => String(machine.machineName || "").trim())
        .map((machine) => ({ value: machine.machineName, label: machine.machineName }))
    );
    const ctagCalculationOptions = [
      { value: "Algebraic", label: "Algebraic" },
      { value: "Addition", label: "Addition" },
      { value: "Subtraction", label: "Subtraction" },
      { value: "Kurtosis", label: "Kurtosis" },
      { value: "Jitter", label: "Jitter" },
      { value: "Standard Deviation", label: "Standard Deviation" },
    ];
    const ctagOperatorOptions = [
      { value: "+", label: "+" },
      { value: "-", label: "-" },
      { value: "*", label: "*" },
      { value: "/", label: "/" },
      { value: "^", label: "^" },
    ];
    const baselineToggleOptions = [
      { value: "On", label: "On" },
      { value: "Off", label: "Off" },
    ];
    const baselinePeriodOptions = plotDurationOptions;
    const baselineTimeline = data.trendMinuteTimes || [];
    const padDatePart = (value) => String(value).padStart(2, "0");
    const dateTimeInputValue = (input) => {
      const date = new Date(input);
      if (Number.isNaN(date.getTime())) return "";
      return `${date.getUTCFullYear()}-${padDatePart(date.getUTCMonth() + 1)}-${padDatePart(date.getUTCDate())}T${padDatePart(date.getUTCHours())}:${padDatePart(date.getUTCMinutes())}`;
    };
    const parseDateTimeInput = (value, endOfMinute = false) => {
      const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
      if (!match) return NaN;
      const [, year, month, day, hour, minute] = match.map(Number);
      return Date.UTC(year, month - 1, day, hour, minute) + (endOfMinute ? 59999 : 0);
    };
    const baselineRangeMin = dateTimeInputValue(baselineTimeline[0]);
    const baselineRangeMax = dateTimeInputValue(baselineTimeline[baselineTimeline.length - 1]);
    const baselineDefaultStart = dateTimeInputValue(new Date(Date.parse(baselineTimeline[baselineTimeline.length - 1]) - 24 * 60 * 60000)) || baselineRangeMin;
    const assetColumns = [
      { headerName: "Asset ID", field: "assetId", readonly: true, idPrefix: "AST", width: "118px" },
      { headerName: "Asset Name", field: "assetName", readonly: true, minWidth: "220px" },
      { headerName: "Location", field: "location", readonly: true, minWidth: "190px" },
      { headerName: "Description", field: "description", readonly: true, minWidth: "340px" },
    ];
    const machineColumns = computed(() => [
      { headerName: "Machine ID", field: "machineId", readonly: true, idPrefix: "MCH", width: "118px" },
      { headerName: "Machine Name", field: "machineName", minWidth: "190px" },
      { headerName: "Location", field: "location", minWidth: "190px" },
      { headerName: "Description", field: "description", minWidth: "260px" },
      ...machineDataSourceFields.value.map((field, index) => ({
        headerName: `Data Source ${index + 1}`,
        field,
        minWidth: "150px",
      })),
    ]);
    const dataSourceColumns = [
      { headerName: "Source ID", field: "dataSourceId", readonly: true, idPrefix: "DS" },
      { headerName: "Machine Name", field: "machineName", readonly: true },
      { headerName: "Data Source Name", field: "sourceName", readonly: true },
      { headerName: "Type", field: "sourceType" },
      { headerName: "Location", field: "location" },
      { headerName: "Network Address", field: "networkAddress" },
    ];
    const tagColumns = [
      { headerName: "Machine Name", field: "machineName", readonly: true },
      { headerName: "Data Source", field: "sourceName", readonly: true },
      { headerName: "Actions", field: "actions", type: "button", buttonLabel: "Connect Tags", actionKey: "connect-tags" },
    ];
    const ctagColumns = [
      { headerName: "CTag ID", field: "ctagId", readonly: true, idPrefix: "CTAG", width: "120px" },
      { headerName: "CTag Name", field: "ctagName", minWidth: "190px" },
      { headerName: "Asset Name", field: "assetName", readonly: true, minWidth: "210px" },
      { headerName: "Source Tags", field: "sourceTagIds", readonly: true, minWidth: "230px" },
      { headerName: "Calculation Type", field: "calculationType", minWidth: "150px" },
      { headerName: "Expression", field: "expression", minWidth: "320px", className: "expression-column" },
      { headerName: "Units", field: "unit", width: "84px" },
      { headerName: "Sampling", field: "samplingRate", width: "104px" },
    ];
    const assetRows = ref(
      data.assets
        .filter((asset) => asset.assetName === selectedAssetName)
        .map((asset) =>
          withRowId({
            assetId: asset.assetId,
            assetName: asset.assetName,
            location: asset.location,
            description: asset.description || "",
          })
        )
    );
    const machineRows = ref(
      selectedMachines.map((machine) => {
        const sources = selectedSources.filter((source) => source.machineName === machine.machineName);
        return withRowId({
          machineId: machine.machineId,
          machineName: machine.machineName,
          location: machine.location,
          description: machine.description || "",
          dataSource1: sources[0]?.sourceName || "",
          dataSource2: sources[1]?.sourceName || "",
        });
      })
    );
    const dataSourceRows = ref([]);
    const tagRows = ref([]);
    const baselineRows = ref(
      (data.baselineRules || [])
        .filter((rule) => rule.assetName === selectedAssetName)
        .map((rule) =>
          withRowId({
            ...rule,
            baselinePeriod: rule.baselinePeriod || "24h",
            sampleCount: rule.sampleCount || "",
            reestablishedAt: rule.reestablishedAt || "Seeded",
            calculationStatus: rule.calculationStatus || "Seeded",
          })
        )
    );
    const assetBaselineStart = ref(baselineDefaultStart);
    const assetBaselineStop = ref(baselineRangeMax);
    const ctagRows = ref(
      data.tags
        .filter((tag) => tag.kind === "CTag" && (!tag.assetName || tag.assetName === selectedAssetName))
        .map((tag) =>
          withRowId({
            ctagId: tag.tagId,
            ctagName: tag.tagName,
            assetName: tag.assetName || selectedAssetName,
            sourceTagIds: tag.sourceTagIds || "",
            calculationType: tag.calculationType || "Algebraic",
            expression: tag.expression || "",
            unit: tag.unit,
            samplingRate: tag.samplingRate,
          })
        )
    );
    const ctagBuilderOpen = ref(false);
    const ctagDraft = reactive({ name: "", calculationType: "Algebraic", terms: [], unit: "", samplingRate: "1Hz" });
    const baselineToast = ref("");
    const router = useRouter();
    const findDownloadedTag = (tagId) => downloadedTags.find((tag) => String(tag.tagId) === String(tagId));
    const formatConnectedTags = (row) =>
      (row.connectedTagIds || [])
        .map((tagId) => {
          const tag = findDownloadedTag(tagId);
          if (!tag) return "";
          const alias = row.connectedTagAliases?.[tagId];
          return alias ? `${tag.tagId} - ${tag.tagName} (${alias})` : `${tag.tagId} - ${tag.tagName}`;
        })
        .filter(Boolean)
        .join(", ");
    const selectedAssetTags = computed(() =>
      tagRows.value.flatMap((row) =>
        (readAssetTagConnections()[sourceKey(row.machineName, row.sourceName)]?.tagIds || [])
          .map((tagId) => {
            const tag = findDownloadedTag(tagId);
            if (!tag) return null;
            return {
              ...tag,
              alias: readAssetTagConnections()[sourceKey(row.machineName, row.sourceName)]?.aliases?.[tagId] || "",
              machineName: row.machineName,
              dataSource: row.sourceName,
            };
          })
          .filter(Boolean)
      )
    );
    const ctagTagOptions = computed(() =>
      selectedAssetTags.value.map((tag) => ({
        value: tag.tagId,
        label: `${tag.tagId} - ${tag.alias || tag.tagName} (${tag.machineName} / ${tag.dataSource})`,
      }))
    );
    const baselineCatalogTags = computed(() => {
      const connectedIds = new Set(selectedAssetTags.value.map((tag) => tag.tagId));
      const configuredIds = new Set(
        (data.baselineRules || [])
          .filter((rule) => rule.assetName === selectedAssetName)
          .map((row) => row.tagId)
          .filter(Boolean)
      );
      const sourceNames = new Set(dataSourceRows.value.map((row) => row.sourceName).filter(Boolean));
      const createdCtags = ctagRows.value
        .filter((row) => row.ctagId && row.ctagName)
        .map((row) => ({
          tagId: row.ctagId,
          tagName: row.ctagName,
          kind: "CTag",
          assetName: row.assetName || selectedAssetName,
          dataSource: "Computed",
          measurementType: row.calculationType || "Calculated",
          unit: row.unit || "",
        }));
      const rows = [
        ...tagCatalog.filter(
          (tag) =>
            connectedIds.has(tag.tagId) ||
            configuredIds.has(tag.tagId) ||
            sourceNames.has(tag.dataSource) ||
            tag.assetName === selectedAssetName
        ),
        ...createdCtags,
      ];
      return [...new Map(rows.map((tag) => [tag.tagId, tag])).values()];
    });
    const baselineColumns = computed(() => [
      { headerName: "Tag Name", field: "tagName", readonly: true, minWidth: "220px" },
      { headerName: "Measurement", field: "measurementType", readonly: true, minWidth: "132px" },
      { headerName: "Low", field: "baselineLow", type: "numeric", readonly: true, width: "92px" },
      { headerName: "High", field: "baselineHigh", type: "numeric", readonly: true, width: "94px" },
      { headerName: "Mean", field: "baselineTarget", type: "numeric", readonly: true, width: "96px" },
      { headerName: "Std Dev", field: "baselineStdDev", type: "numeric", readonly: true, width: "96px" },
      { headerName: "Last Established", field: "reestablishedAt", readonly: true, minWidth: "164px" },
      { headerName: "Enabled", field: "enabled", type: "select", options: baselineToggleOptions, width: "104px" },
    ]);
    const baselineDateTimeControls = computed(() => [
      { key: "start", label: "Start", type: "datetime-local", value: assetBaselineStart.value, min: baselineRangeMin, max: assetBaselineStop.value || baselineRangeMax },
      { key: "stop", label: "Stop", type: "datetime-local", value: assetBaselineStop.value, min: assetBaselineStart.value || baselineRangeMin, max: baselineRangeMax },
    ]);
    const baselineToolbarActions = [{ key: "reestablish-asset-baselines", label: "Reestablish All" }];
    const resetCtagTerms = () => {
      ctagDraft.terms = [
        { tagId: "", operator: "+" },
        { tagId: "", operator: "+" },
        { tagId: "", operator: "+" },
      ];
    };
    const addCtagTerm = () => {
      ctagDraft.terms.push({ tagId: "", operator: "+" });
    };
    const selectedCtagTagIds = () => ctagDraft.terms.map((term) => term.tagId).filter(Boolean);
    const ctagExpressionText = () => {
      const tagIds = selectedCtagTagIds();
      if (!tagIds.length) return "";
      if (ctagDraft.calculationType === "Addition") return tagIds.join(" + ");
      if (ctagDraft.calculationType === "Subtraction") return tagIds.join(" - ");
      if (["Kurtosis", "Jitter", "Standard Deviation"].includes(ctagDraft.calculationType)) {
        return `${ctagDraft.calculationType.replace(/\s+/g, "")}(${tagIds.join(", ")})`;
      }
      return ctagDraft.terms
        .filter((term) => term.tagId)
        .map((term, index) => (index === 0 ? term.tagId : `${term.operator || "+"} ${term.tagId}`))
        .join(" ");
    };
    const ctagFormulaPreview = computed(() => `CTag = ${ctagExpressionText() || "[Tag] [Operator] [Tag]"}`);
    const formatBaselineDate = (date = new Date()) =>
      date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    const normalizeBaselineDate = (value) => {
      const text = String(value || "").trim();
      return text && text !== "Seeded" ? text : formatBaselineDate();
    };
    const baselineToggleValue = (value) => {
      const text = String(value || "").trim().toLowerCase();
      return ["off", "no", "false", "disabled"].includes(text) ? "Off" : "On";
    };
    const baselineRange = () => {
      const fallbackStart = parseDateTimeInput(baselineDefaultStart);
      const fallbackStop = parseDateTimeInput(baselineRangeMax, true);
      const start = parseDateTimeInput(assetBaselineStart.value);
      const stop = parseDateTimeInput(assetBaselineStop.value, true);
      const resolvedStart = Number.isFinite(start) ? start : fallbackStart;
      const resolvedStop = Number.isFinite(stop) ? stop : fallbackStop;
      return resolvedStart <= resolvedStop
        ? { start: resolvedStart, stop: resolvedStop }
        : { start: resolvedStop, stop: resolvedStart };
    };
    const formatBaselineRangeValue = (value) => {
      const [date = "", time = ""] = String(value || "").split("T");
      if (!date || !time) return "";
      return `${date} ${time}`;
    };
    const baselineRangeLabel = () => `${formatBaselineRangeValue(assetBaselineStart.value)} to ${formatBaselineRangeValue(assetBaselineStop.value)}`;
    const baselineTagLabel = (tag) => `${tag.tagId} - ${tag.tagName || tag.tagId}`;
    const baselineRuleHasValue = (row) => Boolean(row.tagId || row.tagName);
    const baselineDecimalsForRow = (row) => {
      const unit = String(row.unit || "");
      if (/rpm|hour|minute|state/i.test(unit)) return 0;
      if (/ips|ratio|v$/i.test(unit)) return 2;
      return 2;
    };
    const quantile = (values, percent) => {
      if (!values.length) return null;
      const sorted = [...values].sort((left, right) => left - right);
      const position = (sorted.length - 1) * percent;
      const lower = Math.floor(position);
      const upper = Math.ceil(position);
      if (lower === upper) return sorted[lower];
      return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
    };
    const baselineWindowValuesForTag = (tag) => {
      const values = trendValuesForTag(tag).map(Number).filter(Number.isFinite);
      if (!values.length) return [];
      const range = baselineRange();
      return values.filter((_, index) => {
        const timestamp = Date.parse(baselineTimeline[index]);
        return Number.isFinite(timestamp) && timestamp >= range.start && timestamp <= range.stop;
      });
    };
    const assetHealthWindowValues = (period) => {
      const sourceNames = new Set(dataSourceRows.value.map((row) => row.sourceName).filter(Boolean));
      const assetTags = tagCatalog.filter(
        (tag) => tag.kind !== "CTag" && (sourceNames.has(tag.dataSource) || tag.assetName === selectedAssetName)
      );
      const windows = assetTags
        .map((tag) => ({ tag, values: baselineWindowValuesForTag(tag) }))
        .filter((entry) => entry.values.length);
      if (!windows.length) return [];
      const sampleCount = Math.min(...windows.map((entry) => entry.values.length));
      return Array.from({ length: sampleCount }, (_, index) => {
        const healthValues = windows.map(({ tag, values }) => {
          const value = values[values.length - sampleCount + index];
          const min = Number(tag.minValue);
          const max = Number(tag.maxValue);
          const center = Number.isFinite(Number(tag.initialValue)) ? Number(tag.initialValue) : (min + max) / 2;
          const span = Number.isFinite(max - min) && max > min ? max - min : Math.max(Math.abs(center), 1);
          const tolerance = Math.max(span * 0.06, Math.abs(center) * 0.08, 1);
          const penalty = Math.min(38, (Math.abs(value - center) / tolerance) * 7);
          return Math.min(Math.max(100 - penalty, 62), 100);
        });
        return healthValues.reduce((total, value) => total + value, 0) / healthValues.length;
      });
    };
    const calculatedBaselineForRow = (row) => {
      const values =
        row.scope === "Asset"
          ? assetHealthWindowValues()
          : baselineWindowValuesForTag(
              baselineCatalogTags.value.find((tag) => tag.tagId === row.tagId) || tagCatalog.find((tag) => tag.tagId === row.tagId)
            );
      if (!values.length) return null;
      const low = quantile(values, 0.1);
      const high = quantile(values, 0.9);
      const baseline = values.reduce((total, value) => total + value, 0) / values.length;
      const variance = values.reduce((total, value) => total + (value - baseline) ** 2, 0) / values.length;
      return { low, baseline, high, stdDev: Math.sqrt(variance), sampleCount: values.length };
    };
    const recalculateBaselineRow = (row, accepted = false) => {
      applyBaselineTagMetadata(row);
      row.baselinePeriod = baselineRangeLabel();
      const calculation = calculatedBaselineForRow(row);
      if (!calculation) {
        row.baselineLow = "";
        row.baselineTarget = "";
        row.baselineStdDev = "";
        row.baselineHigh = "";
        row.sampleCount = "";
        row.calculationStatus = "No Data";
        return false;
      }
      const decimals = baselineDecimalsForRow(row);
      row.baselineLow = formatNumber(calculation.low, decimals);
      row.baselineTarget = formatNumber(calculation.baseline, decimals);
      row.baselineStdDev = formatNumber(calculation.stdDev, decimals);
      row.baselineHigh = formatNumber(calculation.high, decimals);
      row.sampleCount = calculation.sampleCount;
      row.calculationStatus = accepted ? "Reestablished" : "Calculated";
      row.reestablishedAt = accepted ? formatBaselineDate() : normalizeBaselineDate(row.reestablishedAt);
      return true;
    };
    const applyBaselineTagMetadata = (row) => {
      row.assetName = selectedAssetName;
      if (row.scope === "Asset") {
        row.tagId = "";
        row.tagName = row.tagName || "Asset Health Index";
        row.tagLabel = row.tagName;
        row.measurementType = row.measurementType || "Composite";
        row.unit = "%";
        return;
      }
      if (!row.tagId) {
        row.tagName = "";
        row.tagLabel = "";
        row.measurementType = "";
        row.unit = "";
        return;
      }
      const tag = baselineCatalogTags.value.find((item) => item.tagId === row.tagId) || tagCatalog.find((item) => item.tagId === row.tagId);
      if (!tag) return;
      row.scope = tag.kind === "CTag" ? "CTag" : "Tag";
      row.assetName = tag.assetName || selectedAssetName;
      row.tagName = tag.tagName;
      row.tagLabel = baselineTagLabel(tag);
      row.measurementType = tag.measurementType || row.measurementType || "";
      row.unit = tag.unit || row.unit || "";
    };
    const syncBaselineRowsFromTags = () => {
      const existingByTagId = new Map(baselineRows.value.filter((row) => row.tagId).map((row) => [row.tagId, row]));
      const seedByTagId = new Map(
        (data.baselineRules || [])
          .filter((rule) => rule.assetName === selectedAssetName && rule.tagId)
          .map((rule) => [rule.tagId, rule])
      );
      const nextRows = [];
      baselineCatalogTags.value
        .filter((tag) => tag.tagId)
        .forEach((tag) => {
          const seed = seedByTagId.get(tag.tagId) || {};
          const row =
            existingByTagId.get(tag.tagId) ||
            withRowId({
              baselineId: seed.baselineId || nextId("BASE", [...baselineRows.value, ...nextRows], "baselineId"),
              tagId: tag.tagId,
              scope: tag.kind === "CTag" ? "CTag" : "Tag",
              baselinePeriod: baselineRangeLabel(),
              baselineLow: seed.baselineLow || "",
              baselineTarget: seed.baselineTarget || "",
              baselineStdDev: seed.baselineStdDev || "",
              baselineHigh: seed.baselineHigh || "",
              sampleCount: seed.sampleCount || "",
              reestablishedAt: normalizeBaselineDate(seed.reestablishedAt),
              calculationStatus: seed.calculationStatus || "Calculated",
              evaluationWindow: seed.evaluationWindow || "15m",
              warningDelay: seed.warningDelay || "",
              enabled: baselineToggleValue(seed.enabled),
              owner: seed.owner || "",
            });
          row.tagId = tag.tagId;
          row.scope = tag.kind === "CTag" ? "CTag" : "Tag";
          row.assetName = tag.assetName || selectedAssetName;
          row.tagName = tag.tagName || row.tagName || tag.tagId;
          row.tagLabel = baselineTagLabel(tag);
          row.measurementType = tag.measurementType || row.measurementType || "";
          row.unit = tag.unit || row.unit || "";
          row.baselinePeriod = baselineRangeLabel();
          row.reestablishedAt = normalizeBaselineDate(row.reestablishedAt || seed.reestablishedAt);
          row.enabled = baselineToggleValue(row.enabled || seed.enabled);
          nextRows.push(row);
        });
      baselineRows.value = nextRows;
      baselineRows.value.forEach((row) => recalculateBaselineRow(row));
    };
    const updateBaselines = () => {
      syncBaselineRowsFromTags();
    };
    const handleBaselineChange = ({ row, column }) => {
      if (column?.field === "enabled") row.enabled = baselineToggleValue(row.enabled);
    };
    const recalculateBaselineRows = () => {
      baselineRows.value.forEach((row) => recalculateBaselineRow(row));
    };
    const handleBaselineRangeChange = ({ key, value }) => {
      if (key === "start") assetBaselineStart.value = value || baselineDefaultStart;
      if (key === "stop") assetBaselineStop.value = value || baselineRangeMax;
      const start = parseDateTimeInput(assetBaselineStart.value);
      const stop = parseDateTimeInput(assetBaselineStop.value);
      if (Number.isFinite(start) && Number.isFinite(stop) && start > stop) {
        if (key === "start") assetBaselineStop.value = assetBaselineStart.value;
        if (key === "stop") assetBaselineStart.value = assetBaselineStop.value;
      }
      recalculateBaselineRows();
    };
    const handleBaselineToolbarAction = (action) => {
      if (action?.key !== "reestablish-asset-baselines") return;
      const rowsToReestablish = baselineRows.value.filter((row) => row.tagId && baselineToggleValue(row.enabled) === "On");
      const count = rowsToReestablish.reduce((total, row) => total + (recalculateBaselineRow(row, true) ? 1 : 0), 0);
      baselineToast.value = count
        ? `Reestablished ${count} enabled tag baselines from ${baselineRangeLabel()}.`
        : `No enabled tag baselines had historian samples from ${baselineRangeLabel()}.`;
    };
    const handleBaselineAction = (payload) => {
      const action = payload?.action || payload;
      if (action?.key === "reestablish-baseline") {
        const row = payload?.row;
        if (!row?.tagId) {
          baselineToast.value = "Select a tag before reestablishing the baseline.";
          return;
        }
        baselineToast.value = recalculateBaselineRow(row, true)
          ? `Reestablished baseline for ${row.tagName || row.tagId} from ${baselineRangeLabel()}.`
          : `No historian samples were available for ${row.tagName || row.tagId}.`;
      }
    };
    const syncTagRowsFromDataSources = () => {
      const existingByKey = new Map(tagRows.value.map((row) => [sourceKey(row.machineName, row.sourceName), row]));
      tagRows.value = dataSourceRows.value.map((source) => {
        const key = sourceKey(source.machineName, source.sourceName);
        const existing = existingByKey.get(key);
        const validTagIds = new Set(downloadedTags.filter((tag) => tag.dataSource === source.sourceName).map((tag) => tag.tagId));
        const row =
          existing ||
          withRowId({
            machineName: source.machineName,
            sourceName: source.sourceName,
            connectedTagsLabel: "",
          });
        row.machineName = source.machineName;
        row.sourceName = source.sourceName;
        const connection = readAssetTagConnections()[key] || { tagIds: [], aliases: {} };
        row.connectedTagIds = (connection.tagIds || []).filter((tagId) => validTagIds.has(tagId));
        row.connectedTagAliases = connection.aliases || {};
        row.connectedTagsLabel = formatConnectedTags(row);
        return row;
      });
    };
    const syncDataSourcesFromMachines = () => {
      const existingByKey = new Map(dataSourceRows.value.map((row) => [sourceKey(row.machineName, row.sourceName), row]));
      const existingBySource = new Map(dataSourceRows.value.map((row) => [String(row.sourceName || "").trim(), row]));
      const knownBySource = new Map(selectedSources.map((source) => [source.sourceName, source]));
      const nextRows = [];
      const seen = new Set();
      machineRows.value.forEach((machine) => {
        const machineName = String(machine.machineName || "").trim();
        if (!machineName) return;
        machineDataSourceFields.value.forEach((field) => {
          const sourceName = String(machine[field] || "").trim();
          if (!sourceName) return;
          const key = sourceKey(machineName, sourceName);
          if (seen.has(key)) return;
          seen.add(key);
          const existing = existingByKey.get(key) || existingBySource.get(sourceName);
          const known = knownBySource.get(sourceName);
          const row = existing || withRowId({});
          row.dataSourceId = row.dataSourceId || known?.dataSourceId || nextId("DS", [...dataSourceRows.value, ...nextRows], "dataSourceId");
          row.machineName = machineName;
          row.sourceName = sourceName;
          row.sourceType = row.sourceType || known?.sourceType || "";
          row.location = row.location || machine.location || "";
          row.networkAddress = row.networkAddress || known?.networkAddress || "";
          nextRows.push(row);
        });
      });
      dataSourceRows.value = nextRows;
    };
    const syncConfigurationTables = () => {
      syncDataSourcesFromMachines();
      syncTagRowsFromDataSources();
      syncBaselineRowsFromTags();
    };
    const addMachineRow = () => {
      machineRows.value.push(
        withRowId({
          machineId: nextId("MCH", machineRows.value, "machineId"),
          machineName: `New Machine ${machineRows.value.length + 1}`,
          assetName: selectedAssetName,
          location: assetRows.value[0]?.location || "",
          description: "",
          ...Object.fromEntries(machineDataSourceFields.value.map((field) => [field, ""])),
        })
      );
      syncConfigurationTables();
    };
    const handleMachineTableAction = (payload) => {
      const action = payload?.action || payload;
      if (action.key === "add-machine") {
        addMachineRow();
        return;
      }
      if (action.key !== "add-data-source" || machineDataSourceCount.value >= 5) return;
      machineDataSourceCount.value += 1;
      machineRows.value.forEach((machine) => {
        machine[`dataSource${machineDataSourceCount.value}`] = machine[`dataSource${machineDataSourceCount.value}`] || "";
      });
      syncConfigurationTables();
    };
    const updateMachines = () => {
      updateTable(machineRows, machineColumns.value);
      syncConfigurationTables();
    };
    const handleMachineChange = () => {
      syncConfigurationTables();
    };
    const openTagConnector = ({ action, row }) => {
      if (action.key !== "connect-tags") return;
      router.push({
        name: "connect-tags",
        query: {
          machine: row.machineName,
          source: row.sourceName,
        },
      });
    };
    const openCtagBuilder = () => {
      ctagDraft.name = "";
      ctagDraft.calculationType = "Algebraic";
      resetCtagTerms();
      ctagDraft.unit = "";
      ctagDraft.samplingRate = "1Hz";
      ctagBuilderOpen.value = true;
    };
    const buildCtagExpression = () => {
      return ctagExpressionText();
    };
    const createCtag = () => {
      const selectedIds = [...new Set(selectedCtagTagIds())];
      const selectedTags = selectedAssetTags.value.filter((tag) => selectedIds.includes(tag.tagId));
      if (!selectedTags.length) return;
      const expression = buildCtagExpression();
      ctagRows.value.push(
        withRowId({
          ctagId: nextId("CTAG", ctagRows.value, "ctagId"),
          ctagName: ctagDraft.name || `CTag ${ctagRows.value.length + 1}`,
          assetName: selectedAssetName,
          sourceTagIds: selectedIds.join(", "),
          calculationType: ctagDraft.calculationType,
          expression,
          unit: ctagDraft.unit,
          samplingRate: ctagDraft.samplingRate,
        })
      );
      ctagBuilderOpen.value = false;
      syncBaselineRowsFromTags();
    };
    const updateCtags = () => {
      updateTable(ctagRows, ctagColumns);
      const lastRow = ctagRows.value[ctagRows.value.length - 1];
      if (lastRow && !lastRow.assetName) lastRow.assetName = selectedAssetName;
      syncBaselineRowsFromTags();
    };
    const regenerateAssetId = () => {
      if (!assetRows.value[0]?.assetId) assetRows.value[0].assetId = nextId("AST", assetRows.value, "assetId");
    };
    const assetContextItems = computed(() => [
      { label: "Asset", value: selectedAssetName },
      { label: "Asset ID", value: assetRows.value[0]?.assetId },
      { label: "Rows", value: assetRows.value.length },
    ]);
    const machineContextItems = computed(() => [
      { label: "Machines", value: machineRows.value.length },
      { label: "Source Columns", value: machineDataSourceCount.value },
    ]);
    const dataSourceContextItems = computed(() => [
      { label: "Sources", value: dataSourceRows.value.length },
      { label: "Machines", value: machineRows.value.length },
    ]);
    const tagContextItems = computed(() => [
      { label: "Source Rows", value: tagRows.value.length },
      { label: "Connected Tags", value: selectedAssetTags.value.length },
    ]);
    const baselineContextItems = computed(() => {
      const configuredRows = baselineRows.value.filter(baselineRuleHasValue);
      return [
        { label: "Tag Baselines", value: configuredRows.length },
        { label: "Start", value: formatBaselineRangeValue(assetBaselineStart.value) },
        { label: "Stop", value: formatBaselineRangeValue(assetBaselineStop.value) },
        { label: "Auto Calculated", value: "Low / High / Mean / Std Dev" },
        { label: "Reestablished", value: configuredRows.filter((row) => row.calculationStatus === "Reestablished").length },
      ];
    });
    const ctagContextItems = computed(() => [
      { label: "CTags", value: ctagRows.value.length },
      { label: "Source Tags", value: selectedAssetTags.value.length },
    ]);
    syncConfigurationTables();
    return {
      assetRows,
      assetColumns,
      assetContextItems,
      machineRows,
      machineColumns,
      machineContextItems,
      machineDataSourceActions,
      dataSourceRows,
      dataSourceColumns,
      dataSourceContextItems,
      tagRows,
      tagColumns,
      tagContextItems,
      baselineRows,
      baselineColumns,
      baselineContextItems,
      baselineDateTimeControls,
      baselineToolbarActions,
      baselineToast,
      ctagRows,
      ctagColumns,
      ctagContextItems,
      ctagBuilderOpen,
      ctagDraft,
      selectedAssetName,
      selectedAssetTags,
      machineOptions,
      ctagCalculationOptions,
      ctagOperatorOptions,
      ctagTagOptions,
      ctagFormulaPreview,
      syncConfigurationTables,
      updateTable,
      updateMachines,
      updateCtags,
      regenerateAssetId,
      handleMachineTableAction,
      handleMachineChange,
      handleBaselineAction,
      handleBaselineChange,
      handleBaselineRangeChange,
      handleBaselineToolbarAction,
      updateBaselines,
      openTagConnector,
      openCtagBuilder,
      addCtagTerm,
      createCtag,
    };
  },
};
