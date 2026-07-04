import { EditableTable } from "../../shared/EditableTable.js";
import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { api, isDataSourceOffline } from "../../../api/client.js";
import {
  createCtag,
  createDatasource,
  createMachine,
  mapBaseline,
  reestablishBaselines,
  updateAsset,
  updateBaseline,
  updateCtag,
  updateDatasource,
  updateMachine,
} from "../../../api/hierarchy.js";
import { computed, onMounted, reactive, ref, useRoute, useRouter, watch } from "../../../lib/vue.js";
import { template } from "./AssetConfiguration.template.js";

export const AssetConfiguration = {
  components: { ScreenHeader, EditableTable },
  template,
  setup() {
    const route = useRoute();
    const router = useRouter();
    const rowId = (() => {
      let index = 0;
      return () => `editable-${index++}`;
    })();
    const withRowId = (row) => ({ __rowId: rowId(), ...row });
    // Business codes are chosen client-side; number past the highest existing
    // PREFIX-### so generated codes never collide with fetched rows.
    const nextCode = (prefix, codes) => {
      const taken = new Set(codes.map(String));
      let nextNumber =
        codes.reduce((maxNumber, code) => {
          const match = String(code || "").match(new RegExp(`^${prefix}-(\\d+)$`));
          return match ? Math.max(maxNumber, Number(match[1])) : maxNumber;
        }, 0) + 1;
      let candidate = `${prefix}-${String(nextNumber).padStart(3, "0")}`;
      while (taken.has(candidate)) {
        nextNumber += 1;
        candidate = `${prefix}-${String(nextNumber).padStart(3, "0")}`;
      }
      return candidate;
    };

    const assetCode = ref("");
    const selectedAssetName = ref("");
    const loading = ref(true);
    const toast = ref("");
    const errorToast = ref("");
    const baselineToast = ref("");
    const failMessage = (error) => (isDataSourceOffline(error) ? "Data source offline" : error.message);
    const reportError = (context, error) => {
      errorToast.value = `${context}: ${failMessage(error)}`;
    };
    const reportSuccess = (message) => {
      toast.value = message;
      errorToast.value = "";
    };

    // Raw backend entities by code — PUT bodies must echo the full entity
    // (id + parent refs), so edits spread over these.
    let rawAsset = null;
    const rawMachines = new Map();
    const rawDatasources = new Map();
    const rawCtags = new Map();
    const rawBaselines = new Map();

    const assetRows = ref([]);
    const machineRows = ref([]);
    const dataSourceRows = ref([]);
    const tagRows = ref([]);
    const ctagRows = ref([]);
    const baselineRows = ref([]);
    const assetTags = ref([]); // raw tags scoped to this asset's datasources

    // --- loading ---------------------------------------------------------------

    const buildBaselineRow = (raw) => withRowId(mapBaseline(raw));
    const loadBaselines = async () => {
      const rows = await api.get(`/assets/${encodeURIComponent(assetCode.value)}/baselines`);
      rawBaselines.clear();
      rows.forEach((raw) => rawBaselines.set(raw.code, raw));
      baselineRows.value = rows.map(buildBaselineRow);
    };
    const loadCtags = async () => {
      const rows = await api.get(`/assets/${encodeURIComponent(assetCode.value)}/ctags`);
      rawCtags.clear();
      rows.forEach((raw) => rawCtags.set(raw.code, raw));
      ctagRows.value = rows.map((raw) =>
        withRowId({
          ctagId: raw.code,
          ctagName: raw.tagName,
          assetName: raw.asset ? raw.asset.assetName : selectedAssetName.value,
          sourceTagIds: raw.sourceTagIds || "",
          calculationType: raw.calculationType || "Algebraic",
          expression: raw.expression || "",
          unit: raw.unit || "",
          samplingRate: raw.samplingRate || "",
        })
      );
    };
    const loadStructure = async () => {
      const [machines, allTags] = await Promise.all([
        api.get(`/assets/${encodeURIComponent(assetCode.value)}/machines`),
        api.get("/tags"),
      ]);
      rawMachines.clear();
      machines.forEach((raw) => rawMachines.set(raw.code, raw));
      const sourcesPerMachine = await Promise.all(
        machines.map((machine) => api.get(`/machines/${encodeURIComponent(machine.code)}/datasources`))
      );
      const sources = sourcesPerMachine.flat();
      rawDatasources.clear();
      sources.forEach((raw) => rawDatasources.set(raw.code, raw));
      const sourceCodes = new Set(sources.map((source) => source.code));
      assetTags.value = allTags.filter((tag) => tag.datasource && sourceCodes.has(tag.datasource.code));
      const tagsBySource = new Map();
      assetTags.value.forEach((tag) => {
        const list = tagsBySource.get(tag.datasource.code) || [];
        list.push(tag);
        tagsBySource.set(tag.datasource.code, list);
      });
      machineRows.value = machines.map((machine) =>
        withRowId({
          machineId: machine.code,
          machineName: machine.machineName || "",
          machineType: machine.machineType || "",
          location: machine.location || "",
          description: machine.description || "",
          sourcesLabel: sources
            .filter((source) => source.machine && source.machine.code === machine.code)
            .map((source) => source.sourceName || source.code)
            .join(", "),
        })
      );
      dataSourceRows.value = sources.map((source) =>
        withRowId({
          dataSourceId: source.code,
          machineCode: source.machine ? source.machine.code : "",
          machineName: source.machine ? source.machine.machineName : "",
          sourceName: source.sourceName || "",
          sourceType: source.sourceType || "",
          location: source.location || "",
          networkAddress: source.networkAddress || "",
        })
      );
      tagRows.value = sources.map((source) =>
        withRowId({
          machineCode: source.machine ? source.machine.code : "",
          machineName: source.machine ? source.machine.machineName : "",
          dataSourceId: source.code,
          sourceName: source.sourceName || "",
          connectedTagsLabel: (tagsBySource.get(source.code) || [])
            .map((tag) => `${tag.code} - ${tag.tagName}`)
            .join(", "),
        })
      );
    };
    const loadAll = async () => {
      loading.value = true;
      try {
        const assets = await api.get("/assets");
        const requested = String(route.query.asset || "");
        rawAsset = assets.find((asset) => asset.code === requested) || assets[0] || null;
        if (!rawAsset) {
          errorToast.value = "No assets are configured yet. Add an asset from the inventory screen.";
          loading.value = false;
          return;
        }
        assetCode.value = rawAsset.code;
        selectedAssetName.value = rawAsset.assetName || rawAsset.code;
        assetRows.value = [
          withRowId({
            assetId: rawAsset.code,
            assetName: rawAsset.assetName || "",
            location: rawAsset.location || "",
            description: rawAsset.description || "",
          }),
        ];
        await Promise.all([loadStructure(), loadCtags(), loadBaselines()]);
        errorToast.value = "";
      } catch (error) {
        reportError("Failed to load asset configuration", error);
      } finally {
        loading.value = false;
      }
    };
    onMounted(loadAll);
    watch(
      () => route.query.asset,
      (next, previous) => {
        if (route.name === "asset-configuration" && next !== previous) loadAll();
      }
    );

    // --- asset -----------------------------------------------------------------

    const saveAsset = async () => {
      const row = assetRows.value[0];
      if (!row || !rawAsset) return;
      try {
        rawAsset = await updateAsset(rawAsset.code, {
          ...rawAsset,
          assetName: row.assetName,
          location: row.location,
          description: row.description,
        });
        selectedAssetName.value = rawAsset.assetName || rawAsset.code;
        reportSuccess(`Saved asset ${rawAsset.code}.`);
      } catch (error) {
        reportError(`Failed to save asset ${row.assetId}`, error);
      }
    };

    // --- machines ---------------------------------------------------------------

    const addMachine = async () => {
      try {
        const allMachines = await api.get("/machines");
        const code = nextCode("MCH", allMachines.map((machine) => machine.code));
        await createMachine(assetCode.value, {
          code,
          machineName: `New Machine ${machineRows.value.length + 1}`,
          machineType: "",
          location: assetRows.value[0]?.location || "",
          description: "",
        });
        await loadStructure();
        reportSuccess(`Added machine ${code}.`);
      } catch (error) {
        reportError("Failed to add machine", error);
      }
    };
    const handleMachineChange = async ({ row }) => {
      const raw = rawMachines.get(row.machineId);
      if (!raw) return;
      try {
        const updated = await updateMachine(row.machineId, {
          ...raw,
          machineName: row.machineName,
          machineType: row.machineType,
          location: row.location,
          description: row.description,
        });
        rawMachines.set(updated.code, updated);
        reportSuccess(`Saved machine ${row.machineId}.`);
      } catch (error) {
        reportError(`Failed to save machine ${row.machineId}`, error);
      }
    };
    const addDatasourceForMachine = async (machineRow) => {
      try {
        const allSources = await api.get("/datasources");
        const code = nextCode("DS", allSources.map((source) => source.code));
        await createDatasource(machineRow.machineId, {
          code,
          sourceName: `New Source ${code}`,
          sourceType: "",
          type: "PLC",
          protocol: "",
          networkAddress: "",
          location: machineRow.location || "",
        });
        await loadStructure();
        reportSuccess(`Added data source ${code} to ${machineRow.machineId}.`);
      } catch (error) {
        reportError(`Failed to add data source to ${machineRow.machineId}`, error);
      }
    };
    const handleMachineTableAction = (payload) => {
      const action = payload?.action || payload;
      if (action?.key === "add-machine") addMachine();
      if (action?.key === "add-datasource" && payload?.row) addDatasourceForMachine(payload.row);
    };

    // --- data sources -------------------------------------------------------------

    const handleDatasourceChange = async ({ row }) => {
      const raw = rawDatasources.get(row.dataSourceId);
      if (!raw) return;
      try {
        const updated = await updateDatasource(row.dataSourceId, {
          ...raw,
          sourceName: row.sourceName,
          sourceType: row.sourceType,
          location: row.location,
          networkAddress: row.networkAddress,
        });
        rawDatasources.set(updated.code, updated);
        reportSuccess(`Saved data source ${row.dataSourceId}.`);
      } catch (error) {
        reportError(`Failed to save data source ${row.dataSourceId}`, error);
      }
    };

    // --- tags -----------------------------------------------------------------------

    const openTagConnector = ({ action, row }) => {
      if (action.key !== "connect-tags") return;
      router.push({
        name: "connect-tags",
        query: {
          machine: row.machineCode,
          source: row.dataSourceId,
        },
      });
    };

    // --- ctags ----------------------------------------------------------------------

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
    const ctagBuilderOpen = ref(false);
    const ctagDraft = reactive({ name: "", calculationType: "Algebraic", terms: [], unit: "", samplingRate: "1Hz" });
    const ctagTagOptions = computed(() =>
      assetTags.value.map((tag) => ({
        value: tag.code,
        label: `${tag.code} - ${tag.tagName} (${tag.datasource?.machine?.machineName || ""} / ${tag.datasource?.sourceName || ""})`,
      }))
    );
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
    const openCtagBuilder = (payload) => {
      const action = payload?.action || payload;
      if (action?.key !== "create-ctag") return;
      ctagDraft.name = "";
      ctagDraft.calculationType = "Algebraic";
      resetCtagTerms();
      ctagDraft.unit = "";
      ctagDraft.samplingRate = "1Hz";
      ctagBuilderOpen.value = true;
    };
    const createCtagRule = async () => {
      const selectedIds = [...new Set(selectedCtagTagIds())];
      if (!selectedIds.length) {
        errorToast.value = "Select at least one source tag for the CTag.";
        return;
      }
      try {
        const allCtags = await api.get("/ctags");
        const code = nextCode("CTAG", allCtags.map((ctag) => ctag.code));
        await createCtag(assetCode.value, {
          code,
          tagName: ctagDraft.name || `CTag ${ctagRows.value.length + 1}`,
          ctagKey: code,
          calculationType: ctagDraft.calculationType,
          expression: ctagExpressionText(),
          sourceTagIds: selectedIds.join(","),
          unit: ctagDraft.unit,
          samplingRate: ctagDraft.samplingRate,
          plot: true,
        });
        ctagBuilderOpen.value = false;
        await loadCtags();
        reportSuccess(`Created CTag ${code}.`);
      } catch (error) {
        reportError("Failed to create CTag", error);
      }
    };
    const handleCtagChange = async ({ row }) => {
      const raw = rawCtags.get(row.ctagId);
      if (!raw) return;
      try {
        const updated = await updateCtag(row.ctagId, {
          ...raw,
          tagName: row.ctagName,
          calculationType: row.calculationType,
          expression: row.expression,
          unit: row.unit,
          samplingRate: row.samplingRate,
        });
        rawCtags.set(updated.code, updated);
        reportSuccess(`Saved CTag ${row.ctagId}.`);
      } catch (error) {
        reportError(`Failed to save CTag ${row.ctagId}`, error);
      }
    };

    // --- baselines --------------------------------------------------------------------

    const baselineToggleOptions = [
      { value: "Yes", label: "Yes" },
      { value: "No", label: "No" },
    ];
    const pad = (value) => String(value).padStart(2, "0");
    const dateTimeInputValue = (date) =>
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    const assetBaselineStart = ref(dateTimeInputValue(new Date(Date.now() - 24 * 60 * 60000)));
    const assetBaselineStop = ref(dateTimeInputValue(new Date()));
    const baselineDateTimeControls = computed(() => [
      { key: "start", label: "Start", type: "datetime-local", value: assetBaselineStart.value, max: assetBaselineStop.value },
      { key: "stop", label: "Stop", type: "datetime-local", value: assetBaselineStop.value, min: assetBaselineStart.value },
    ]);
    const baselineToolbarActions = [{ key: "reestablish-asset-baselines", label: "Reestablish All" }];
    const formatBaselineRangeValue = (value) => String(value || "").replace("T", " ");
    const baselineRangeLabel = () =>
      `${formatBaselineRangeValue(assetBaselineStart.value)} to ${formatBaselineRangeValue(assetBaselineStop.value)}`;
    const handleBaselineRangeChange = ({ key, value }) => {
      if (key === "start" && value) assetBaselineStart.value = value;
      if (key === "stop" && value) assetBaselineStop.value = value;
      if (assetBaselineStart.value > assetBaselineStop.value) {
        if (key === "start") assetBaselineStop.value = assetBaselineStart.value;
        else assetBaselineStart.value = assetBaselineStop.value;
      }
    };
    const reestablishing = ref(false);
    const handleBaselineToolbarAction = async (action) => {
      if (action?.key !== "reestablish-asset-baselines" || reestablishing.value) return;
      const start = new Date(assetBaselineStart.value);
      const stop = new Date(assetBaselineStop.value);
      if (Number.isNaN(start.getTime()) || Number.isNaN(stop.getTime())) {
        baselineToast.value = "";
        errorToast.value = "Choose a valid start and stop time before reestablishing baselines.";
        return;
      }
      reestablishing.value = true;
      baselineToast.value = "";
      try {
        const updated = await reestablishBaselines(assetCode.value, start.toISOString(), stop.toISOString());
        baselineRows.value = updated.map((row) => withRowId(row));
        // refresh raw entities so subsequent enable toggles echo current values
        const rows = await api.get(`/assets/${encodeURIComponent(assetCode.value)}/baselines`);
        rawBaselines.clear();
        rows.forEach((raw) => rawBaselines.set(raw.code, raw));
        errorToast.value = "";
        baselineToast.value = `Reestablished ${updated.length} baseline${updated.length === 1 ? "" : "s"} from ${baselineRangeLabel()}.`;
      } catch (error) {
        reportError("Failed to reestablish baselines", error);
      } finally {
        reestablishing.value = false;
      }
    };
    const handleBaselineChange = async ({ row, column }) => {
      if (column?.field !== "enabled") return;
      const raw = rawBaselines.get(row.baselineId);
      if (!raw) return;
      const enabled = String(row.enabled).toLowerCase() !== "no";
      row.enabled = enabled ? "Yes" : "No";
      try {
        const updated = await updateBaseline(row.baselineId, { ...raw, enabled });
        rawBaselines.set(updated.code, updated);
        reportSuccess(`Baseline ${row.baselineId} ${enabled ? "enabled" : "disabled"}.`);
      } catch (error) {
        row.enabled = raw.enabled ? "Yes" : "No";
        reportError(`Failed to update baseline ${row.baselineId}`, error);
      }
    };

    // --- columns / context ----------------------------------------------------------

    const assetColumns = [
      { headerName: "Asset ID", field: "assetId", readonly: true, width: "118px" },
      { headerName: "Asset Name", field: "assetName", minWidth: "220px" },
      { headerName: "Location", field: "location", minWidth: "190px" },
      { headerName: "Description", field: "description", minWidth: "340px" },
    ];
    const machineColumns = [
      { headerName: "Machine ID", field: "machineId", readonly: true, width: "118px" },
      { headerName: "Machine Name", field: "machineName", minWidth: "180px" },
      { headerName: "Type", field: "machineType", minWidth: "130px" },
      { headerName: "Location", field: "location", minWidth: "160px" },
      { headerName: "Description", field: "description", minWidth: "220px" },
      { headerName: "Data Sources", field: "sourcesLabel", readonly: true, minWidth: "180px" },
      { headerName: "Actions", field: "actions", type: "button", buttonLabel: "Add Data Source", actionKey: "add-datasource" },
    ];
    const dataSourceColumns = [
      { headerName: "Source ID", field: "dataSourceId", readonly: true, width: "110px" },
      { headerName: "Machine Name", field: "machineName", readonly: true, minWidth: "160px" },
      { headerName: "Data Source Name", field: "sourceName", minWidth: "190px" },
      { headerName: "Type", field: "sourceType", minWidth: "130px" },
      { headerName: "Location", field: "location", minWidth: "160px" },
      { headerName: "Network Address", field: "networkAddress", minWidth: "170px" },
    ];
    const tagColumns = [
      { headerName: "Machine Name", field: "machineName", readonly: true, minWidth: "160px" },
      { headerName: "Data Source", field: "sourceName", readonly: true, minWidth: "170px" },
      { headerName: "Connected Tags", field: "connectedTagsLabel", readonly: true, minWidth: "320px" },
      { headerName: "Actions", field: "actions", type: "button", buttonLabel: "Connect Tags", actionKey: "connect-tags" },
    ];
    const ctagColumns = [
      { headerName: "CTag ID", field: "ctagId", readonly: true, width: "150px" },
      { headerName: "CTag Name", field: "ctagName", minWidth: "190px" },
      { headerName: "Asset Name", field: "assetName", readonly: true, minWidth: "200px" },
      { headerName: "Source Tags", field: "sourceTagIds", readonly: true, minWidth: "230px" },
      { headerName: "Calculation Type", field: "calculationType", minWidth: "150px" },
      { headerName: "Expression", field: "expression", minWidth: "320px", className: "expression-column" },
      { headerName: "Units", field: "unit", width: "84px" },
      { headerName: "Sampling", field: "samplingRate", width: "104px" },
    ];
    const baselineColumns = [
      { headerName: "Baseline ID", field: "baselineId", readonly: true, minWidth: "140px" },
      { headerName: "Tag Name", field: "tagName", readonly: true, minWidth: "200px" },
      { headerName: "Scope", field: "scope", readonly: true, width: "88px" },
      { headerName: "Low", field: "baselineLow", type: "numeric", readonly: true, width: "92px" },
      { headerName: "High", field: "baselineHigh", type: "numeric", readonly: true, width: "94px" },
      { headerName: "Mean", field: "baselineTarget", type: "numeric", readonly: true, width: "96px" },
      { headerName: "Std Dev", field: "baselineStdDev", type: "numeric", readonly: true, width: "96px" },
      { headerName: "Enabled", field: "enabled", type: "select", options: baselineToggleOptions, width: "104px" },
    ];

    const assetContextItems = computed(() => [
      { label: "Asset", value: selectedAssetName.value },
      { label: "Asset ID", value: assetCode.value },
    ]);
    const machineContextItems = computed(() => [
      { label: "Machines", value: machineRows.value.length },
      { label: "Data Sources", value: dataSourceRows.value.length },
    ]);
    const dataSourceContextItems = computed(() => [
      { label: "Sources", value: dataSourceRows.value.length },
      { label: "Machines", value: machineRows.value.length },
    ]);
    const tagContextItems = computed(() => [
      { label: "Source Rows", value: tagRows.value.length },
      { label: "Connected Tags", value: assetTags.value.length },
    ]);
    const ctagContextItems = computed(() => [
      { label: "CTags", value: ctagRows.value.length },
      { label: "Source Tags", value: assetTags.value.length },
    ]);
    const baselineContextItems = computed(() => [
      { label: "Baselines", value: baselineRows.value.length },
      { label: "Enabled", value: baselineRows.value.filter((row) => row.enabled === "Yes").length },
      { label: "Start", value: formatBaselineRangeValue(assetBaselineStart.value) },
      { label: "Stop", value: formatBaselineRangeValue(assetBaselineStop.value) },
    ]);

    return {
      loading,
      toast,
      errorToast,
      baselineToast,
      assetRows,
      assetColumns,
      assetContextItems,
      saveAsset,
      machineRows,
      machineColumns,
      machineContextItems,
      handleMachineTableAction,
      handleMachineChange,
      dataSourceRows,
      dataSourceColumns,
      dataSourceContextItems,
      handleDatasourceChange,
      tagRows,
      tagColumns,
      tagContextItems,
      openTagConnector,
      ctagRows,
      ctagColumns,
      ctagContextItems,
      handleCtagChange,
      ctagBuilderOpen,
      ctagDraft,
      ctagCalculationOptions,
      ctagOperatorOptions,
      ctagTagOptions,
      ctagFormulaPreview,
      openCtagBuilder,
      addCtagTerm,
      createCtagRule,
      selectedAssetName,
      baselineRows,
      baselineColumns,
      baselineContextItems,
      baselineDateTimeControls,
      baselineToolbarActions,
      reestablishing,
      handleBaselineRangeChange,
      handleBaselineToolbarAction,
      handleBaselineChange,
    };
  },
};
