import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { fetchGroups, fetchUsers } from "../../../api/admin.js";
import { createAlarmRule, fetchAlarmRule, fetchAlarmRules, updateAlarmRule } from "../../../api/alarms.js";
import { isDataSourceOffline } from "../../../api/client.js";
import { fetchAssetTree, fetchAssets } from "../../../api/hierarchy.js";
import { computed, onMounted, reactive, ref, useRoute, watch } from "../../../lib/vue.js";

export const AlarmConfiguration = {
  components: { ScreenHeader },
  template: `
    <div class="screen">
      <screen-header
        title="Alarm Configuration"
        subtitle="Build alarm logic from configured asset Tags and CTags"
      />
      <div v-if="errorMessage" class="inline-alert">{{ errorMessage }}</div>
      <section class="panel alarm-config-panel">
        <div class="panel-header">
          <h2>Alarm Definition</h2>
        </div>
        <div class="field-grid three">
          <label>
            <span>Select Asset</span>
            <select v-model="selectedAssetCode">
              <option v-for="asset in assets" :key="asset.assetId" :value="asset.assetId">{{ asset.assetName }} ({{ asset.assetId }})</option>
            </select>
          </label>
          <label>
            <span>Alarm Name</span>
            <input v-model="alarmName" placeholder="Enter alarm name" />
          </label>
          <label>
            <span>Alarm Type</span>
            <select v-model="alarmType">
              <option>Threshold</option>
              <option>Rate of Change</option>
              <option>Combinatorial Logic</option>
            </select>
          </label>
          <label>
            <span>Alarm ID</span>
            <input :value="alarmCode" readonly />
          </label>
          <label>
            <span>Severity</span>
            <select v-model="severity">
              <option value="red">Red</option>
              <option value="yellow">Yellow</option>
            </select>
          </label>
          <label>
            <span>Enabled</span>
            <select v-model="enabledState">
              <option :value="true">Yes</option>
              <option :value="false">No</option>
            </select>
          </label>
        </div>
      </section>

      <section class="panel alarm-config-panel">
        <div class="panel-header">
          <h2>Formula Builder</h2>
        </div>
        <table-context
          title="Formula inputs"
          description="Fields used by the selected alarm type."
          :items="[
            { label: 'Alarm Type', value: alarmType },
            { label: 'Available Tags', value: assetTagOptions.length },
            { label: 'Alarm Name', value: alarmName }
          ]"
        />

        <table v-if="alarmType === 'Threshold'" class="editable-table alarm-formula-table">
          <thead>
            <tr>
              <th>If</th>
              <th>Tag / CTag Selection List for Asset</th>
              <th>Operator</th>
              <th>Input Value</th>
              <th>Then</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><input value="If" readonly /></td>
              <td>
                <select v-model="thresholdRule.tagId">
                  <option v-for="tag in assetTagOptions" :key="tag.value" :value="tag.value">{{ tag.label }}</option>
                </select>
              </td>
              <td>
                <select v-model="thresholdRule.operator">
                  <option>&gt;</option>
                  <option>&lt;</option>
                  <option>=</option>
                </select>
              </td>
              <td><input v-model="thresholdRule.value" class="numeric-input" inputmode="decimal" /></td>
              <td class="display-cell"><span class="table-display-field">Notify selected groups and users</span></td>
            </tr>
          </tbody>
        </table>

        <table v-else-if="alarmType === 'Rate of Change'" class="editable-table alarm-formula-table">
          <thead>
            <tr>
              <th>If</th>
              <th>Tag / CTag Selection List for Asset</th>
              <th>Condition</th>
              <th>Input Value</th>
              <th>Units</th>
              <th>Per</th>
              <th>Then</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><input value="If" readonly /></td>
              <td>
                <select v-model="rateRule.tagId">
                  <option v-for="tag in assetTagOptions" :key="tag.value" :value="tag.value">{{ tag.label }}</option>
                </select>
              </td>
              <td><input value="Rate of Change exceeds" readonly /></td>
              <td><input v-model="rateRule.value" class="numeric-input" inputmode="decimal" /></td>
              <td>
                <select v-model="rateRule.unit">
                  <option v-for="unit in rateUnits" :key="unit">{{ unit }}</option>
                </select>
              </td>
              <td>
                <select v-model="rateRule.period">
                  <option>second</option>
                  <option>minute</option>
                  <option>hour</option>
                  <option>day</option>
                </select>
              </td>
              <td class="display-cell"><span class="table-display-field">Notify selected groups and users</span></td>
            </tr>
          </tbody>
        </table>

        <div v-else class="combinatorial-builder">
          <div class="field-grid two">
            <label>
              <span>Tag / CTag Selector</span>
              <select v-model="logicSelectedTag">
                <option v-for="tag in assetTagOptions" :key="tag.value" :value="tag.value">{{ tag.label }}</option>
              </select>
            </label>
            <label>
              <span>Insert Selection</span>
              <button type="button" class="primary block" @click="insertLogicTag">Insert Tag / CTag</button>
            </label>
            <label>
              <span>Operator</span>
              <select v-model="logicSelectedOperator">
                <option v-for="operator in logicOperatorOptions" :key="operator.value" :value="operator.value">{{ operator.label }}</option>
              </select>
            </label>
            <label>
              <span>Insert Operator</span>
              <button type="button" class="primary block" @click="insertLogicOperator">Insert Operator</button>
            </label>
            <label class="wide">
              <span>Formula Writing Space</span>
              <textarea v-model="logicFormula" rows="6" placeholder="Example: ([Tag] > 39.50) AND ([CTag] = TRUE)"></textarea>
            </label>
          </div>
        </div>
      </section>

      <section class="panel alarm-config-panel">
        <div class="panel-header">
          <h2>Notify</h2>
        </div>
        <div class="notify-target-grid">
          <div>
            <h3>Groups</h3>
            <label v-for="group in groups" :key="group.groupId">
              <input type="checkbox" :value="group.groupId" v-model="selectedGroups" />
              <span>{{ group.groupName }}</span>
            </label>
          </div>
          <div>
            <h3>Users</h3>
            <label v-for="user in users" :key="user.userId">
              <input type="checkbox" :value="user.userId" v-model="selectedUsers" />
              <span>{{ user.userName }}</span>
            </label>
          </div>
        </div>
      </section>

      <div class="table-command-row">
        <button type="button" class="primary" :disabled="saving" @click="updateAlarm">{{ saving ? "Saving..." : isEditing ? "Update" : "Create Alarm" }}</button>
      </div>
      <div v-if="savedMessage" class="inline-alert success">{{ savedMessage }}</div>
    </div>
  `,
  setup() {
    const route = useRoute();
    const editingCode = String(route.query.alarm || "");
    const isEditing = ref(Boolean(editingCode));
    const assets = ref([]);
    const groups = ref([]);
    const users = ref([]);
    const selectedAssetCode = ref(String(route.query.asset || ""));
    const alarmCode = ref(editingCode);
    const alarmName = ref("");
    const alarmType = ref("Threshold");
    const severity = ref("red");
    const enabledState = ref(true);
    const thresholdRule = reactive({ tagId: "", operator: ">", value: "" });
    const rateRule = reactive({ tagId: "", value: "5.00", unit: "%", period: "minute" });
    const logicSelectedTag = ref("");
    const logicSelectedOperator = ref(">");
    const logicFormula = ref("");
    const selectedGroups = ref([]);
    const selectedUsers = ref([]);
    const savedMessage = ref("");
    const errorMessage = ref("");
    const saving = ref(false);
    const assetTagOptions = ref([]);
    const logicOperatorOptions = [
      { label: "+", value: "+" },
      { label: "-", value: "-" },
      { label: "*", value: "*" },
      { label: "/", value: "/" },
      { label: ">", value: ">" },
      { label: "<", value: "<" },
      { label: ">=", value: ">=" },
      { label: "<=", value: "<=" },
      { label: "=", value: "=" },
      { label: "!=", value: "!=" },
      { label: "AND", value: "AND" },
      { label: "OR", value: "OR" },
      { label: "NOT", value: "NOT" },
      { label: "(", value: "(" },
      { label: ")", value: ")" },
      { label: "Average", value: "Average()" },
      { label: "Sum", value: "Sum()" },
      { label: "Minimum", value: "Min()" },
      { label: "Maximum", value: "Max()" },
      { label: "Standard Deviation", value: "StandardDeviation()" },
      { label: "Rate Of Change", value: "RateOfChange()" },
      { label: "Absolute Value", value: "Abs()" },
    ];
    const failMessage = (error) => (isDataSourceOffline(error) ? "Data source offline" : error.message);

    const nextAlarmCode = (rules) => {
      const nextNumber =
        rules.reduce((maxNumber, rule) => {
          const match = String(rule.code || "").match(/^ALR-(\d+)$/);
          return match ? Math.max(maxNumber, Number(match[1])) : maxNumber;
        }, 0) + 1;
      return `ALR-${String(nextNumber).padStart(3, "0")}`;
    };
    // Tag/CTag options scoped to the selected asset (tree gives both cheaply).
    const loadTagOptions = async (assetCode) => {
      if (!assetCode) {
        assetTagOptions.value = [];
        return;
      }
      const tree = await fetchAssetTree(assetCode);
      const tags = (tree.machines || []).flatMap((machine) =>
        (machine.datasources || []).flatMap((source) =>
          (source.tags || []).map((tag) => ({
            value: tag.code,
            label: `${tag.code} - ${tag.tagName}`,
            unit: tag.unit || "",
            kind: "TAG",
          }))
        )
      );
      const ctags = (tree.ctags || []).map((ctag) => ({
        value: ctag.code,
        label: `${ctag.code} - ${ctag.tagName}`,
        unit: "",
        kind: "CTAG",
      }));
      assetTagOptions.value = [...tags, ...ctags];
    };
    const rateUnits = computed(() => {
      const units = new Set(["%"]);
      assetTagOptions.value.forEach((tag) => {
        if (tag.unit) units.add(tag.unit);
      });
      if (rateRule.unit) units.add(rateRule.unit);
      return [...units];
    });
    const ensureSelectedTag = () => {
      const first = assetTagOptions.value[0]?.value || "";
      if (!assetTagOptions.value.some((tag) => tag.value === thresholdRule.tagId)) thresholdRule.tagId = first;
      if (!assetTagOptions.value.some((tag) => tag.value === rateRule.tagId)) rateRule.tagId = first;
      if (!assetTagOptions.value.some((tag) => tag.value === logicSelectedTag.value)) logicSelectedTag.value = first;
    };
    watch(assetTagOptions, ensureSelectedTag);
    watch(selectedAssetCode, async (assetCode) => {
      try {
        await loadTagOptions(assetCode);
        errorMessage.value = "";
      } catch (error) {
        assetTagOptions.value = [];
        errorMessage.value = `Failed to load tags for ${assetCode}: ${failMessage(error)}`;
      }
    });
    watch(alarmType, () => {
      savedMessage.value = "";
    });

    const applyRule = (rule) => {
      alarmCode.value = rule.code;
      selectedAssetCode.value = rule.assetCode || selectedAssetCode.value;
      alarmName.value = rule.alarmName || "";
      alarmType.value = rule.alarmType || "Threshold";
      severity.value = (rule.severity || "red").toLowerCase();
      enabledState.value = rule.enabled !== false;
      const watched = rule.watchedTagCode || "";
      thresholdRule.tagId = watched;
      thresholdRule.operator = rule.operator || ">";
      thresholdRule.value = rule.thresholdValue === null || rule.thresholdValue === undefined ? "" : String(rule.thresholdValue);
      rateRule.tagId = watched;
      rateRule.value = rule.rateValue === null || rule.rateValue === undefined ? "5.00" : String(rule.rateValue);
      rateRule.unit = rule.rateUnit || "%";
      rateRule.period = rule.ratePeriod || "minute";
      logicSelectedTag.value = watched;
      logicFormula.value = rule.logicFormula || "";
      selectedGroups.value = [...(rule.notifyGroupCodes || [])];
      selectedUsers.value = [...(rule.notifyUserCodes || [])];
    };
    onMounted(async () => {
      try {
        const [assetRows, groupRows, userRows, rules] = await Promise.all([
          fetchAssets(),
          fetchGroups(),
          fetchUsers(),
          fetchAlarmRules(),
        ]);
        assets.value = assetRows;
        groups.value = groupRows;
        users.value = userRows;
        if (isEditing.value) {
          applyRule(await fetchAlarmRule(editingCode));
        } else {
          alarmCode.value = nextAlarmCode(rules);
          if (!selectedAssetCode.value) selectedAssetCode.value = assetRows[0]?.assetId || "";
        }
        // Load tag options for the initial asset (the watch may not have fired
        // when the asset code came from the route and did not change).
        await loadTagOptions(selectedAssetCode.value);
        if (!isEditing.value) ensureSelectedTag();
        errorMessage.value = "";
      } catch (error) {
        errorMessage.value = `Failed to load alarm configuration: ${failMessage(error)}`;
      }
    });

    const insertLogicTag = () => {
      if (!logicSelectedTag.value) return;
      const insertion = `[${logicSelectedTag.value}]`;
      logicFormula.value = logicFormula.value ? `${logicFormula.value} ${insertion}` : insertion;
    };
    const insertLogicOperator = () => {
      if (!logicSelectedOperator.value) return;
      logicFormula.value = logicFormula.value ? `${logicFormula.value} ${logicSelectedOperator.value}` : logicSelectedOperator.value;
    };

    const watchedTagForType = () => {
      if (alarmType.value === "Threshold") return thresholdRule.tagId;
      if (alarmType.value === "Rate of Change") return rateRule.tagId;
      return logicSelectedTag.value;
    };
    const buildDto = () => {
      const watchedTagCode = watchedTagForType();
      const watchedOption = assetTagOptions.value.find((tag) => tag.value === watchedTagCode);
      const isThreshold = alarmType.value === "Threshold";
      const isRate = alarmType.value === "Rate of Change";
      return {
        code: alarmCode.value,
        assetCode: selectedAssetCode.value,
        alarmName: alarmName.value.trim(),
        alarmType: alarmType.value,
        enabled: enabledState.value,
        severity: severity.value,
        watchedTagCode,
        watchedKind: watchedOption?.kind || "TAG",
        operator: isThreshold ? thresholdRule.operator : null,
        thresholdValue: isThreshold && thresholdRule.value !== "" ? Number(thresholdRule.value) : null,
        rateValue: isRate && rateRule.value !== "" ? Number(rateRule.value) : null,
        rateUnit: isRate ? rateRule.unit : null,
        ratePeriod: isRate ? rateRule.period : null,
        logicFormula: alarmType.value === "Combinatorial Logic" ? logicFormula.value : null,
        notifyGroupCodes: [...selectedGroups.value],
        notifyUserCodes: [...selectedUsers.value],
      };
    };
    const updateAlarm = async () => {
      savedMessage.value = "";
      errorMessage.value = "";
      const dto = buildDto();
      if (!dto.alarmName) {
        errorMessage.value = "Alarm name is required.";
        return;
      }
      if (!dto.assetCode) {
        errorMessage.value = "Select an asset for the alarm.";
        return;
      }
      if (!dto.watchedTagCode) {
        errorMessage.value = "Select a Tag or CTag for the alarm to watch.";
        return;
      }
      saving.value = true;
      try {
        if (isEditing.value) {
          await updateAlarmRule(alarmCode.value, dto);
        } else {
          await createAlarmRule(dto);
          isEditing.value = true;
        }
        savedMessage.value = `${dto.alarmType} alarm ${dto.code} saved for ${dto.assetCode}.`;
      } catch (error) {
        errorMessage.value = `Failed to save alarm: ${failMessage(error)}`;
      } finally {
        saving.value = false;
      }
    };
    return {
      assets,
      groups,
      users,
      isEditing,
      selectedAssetCode,
      alarmCode,
      alarmName,
      alarmType,
      severity,
      enabledState,
      thresholdRule,
      rateRule,
      logicSelectedTag,
      logicSelectedOperator,
      logicFormula,
      logicOperatorOptions,
      selectedGroups,
      selectedUsers,
      savedMessage,
      errorMessage,
      saving,
      assetTagOptions,
      rateUnits,
      insertLogicTag,
      insertLogicOperator,
      updateAlarm,
    };
  },
};
