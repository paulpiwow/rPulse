import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { data } from "../../../data/index.js";
import { tagCatalog } from "../../../lib/tags.js";
import { computed, reactive, ref, watch } from "../../../lib/vue.js";

export const AlarmConfiguration = {
  components: { ScreenHeader },
  template: `
    <div class="screen">
      <screen-header
        title="Alarm Configuration"
        subtitle="Build alarm logic from configured asset Tags and CTags"
      />
      <section class="panel alarm-config-panel">
        <div class="panel-header">
          <h2>Alarm Definition</h2>
        </div>
        <div class="field-grid three">
          <label>
            <span>Select Asset</span>
            <select v-model="selectedAssetName">
              <option v-for="asset in assets" :key="asset.assetId" :value="asset.assetName">{{ asset.assetName }}</option>
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
              <input type="checkbox" :value="group.groupName" v-model="selectedGroups" />
              <span>{{ group.groupName }}</span>
            </label>
          </div>
          <div>
            <h3>Users</h3>
            <label v-for="user in users" :key="user.userId">
              <input type="checkbox" :value="user.userName" v-model="selectedUsers" />
              <span>{{ user.userName }}</span>
            </label>
          </div>
        </div>
      </section>

      <div class="table-command-row">
        <button type="button" class="primary" @click="updateAlarm">Update</button>
      </div>
      <div v-if="savedMessage" class="inline-alert success">{{ savedMessage }}</div>
    </div>
  `,
  setup() {
    const assets = data.assets;
    const defaultAlarmDetail = data.alarmDetails[0] || {};
    const defaultTag = tagCatalog.find((tag) => tag.tagName === defaultAlarmDetail.tagName || tag.tagId === defaultAlarmDetail.tagName) || tagCatalog[0] || {};
    const defaultAlarmAsset =
      assets.find((asset) => asset.assetName === (data.activeAlarms[0]?.assetName || defaultTag.assetName)) ||
      assets.find((asset) => asset.activeAlarms > 0) ||
      assets[0];
    const selectedAssetName = ref(defaultAlarmAsset?.assetName || "");
    const alarmName = ref(data.activeAlarms[0]?.alarmName || "Final Discharge Temperature High");
    const alarmType = ref("Threshold");
    const thresholdRule = reactive({
      tagId: defaultTag.tagId || "",
      operator: defaultAlarmDetail.condition === "Less Than" ? "<" : ">",
      value: String(defaultAlarmDetail.value ?? defaultTag.maxValue ?? ""),
    });
    const rateRule = reactive({ tagId: defaultTag.tagId || "", value: "5.00", unit: defaultTag.unit || "%", period: "minute" });
    const logicSelectedTag = ref(defaultTag.tagId || "");
    const logicSelectedOperator = ref(">");
    const logicFormula = ref("");
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
    const defaultGroupName =
      data.groups.find((group) => group.groupName === data.activeAlarms[0]?.assignment)?.groupName ||
      data.groups[0]?.groupName ||
      "";
    const selectedGroups = ref(defaultGroupName ? [defaultGroupName] : []);
    const selectedUsers = ref([]);
    const savedMessage = ref("");
    const tagOptionsForAsset = (assetName) => {
      const machineNames = data.machines.filter((machine) => machine.assetName === assetName).map((machine) => machine.machineName);
      const sourceNames = data.dataSources
        .filter((source) => machineNames.includes(source.machineName))
        .map((source) => source.sourceName);
      return tagCatalog
        .filter((tag) => sourceNames.includes(tag.dataSource) || (tag.kind === "CTag" && tag.assetName === assetName))
        .map((tag) => ({
          value: tag.tagId,
          label: `${tag.tagId} - ${tag.tagName}`,
          unit: tag.unit,
        }));
    };
    const assetTagOptions = computed(() => tagOptionsForAsset(selectedAssetName.value));
    const rateUnits = computed(() => {
      const units = new Set(["%"]);
      assetTagOptions.value.forEach((tag) => {
        if (tag.unit) units.add(tag.unit);
      });
      return [...units];
    });
    const ensureSelectedTag = () => {
      const first = assetTagOptions.value[0]?.value || "";
      if (!assetTagOptions.value.some((tag) => tag.value === thresholdRule.tagId)) thresholdRule.tagId = first;
      if (!assetTagOptions.value.some((tag) => tag.value === rateRule.tagId)) rateRule.tagId = first;
      if (!assetTagOptions.value.some((tag) => tag.value === logicSelectedTag.value)) logicSelectedTag.value = first;
    };
    watch(assetTagOptions, ensureSelectedTag, { immediate: true });
    watch(alarmType, () => {
      savedMessage.value = "";
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
    const updateAlarm = () => {
      savedMessage.value = `${alarmType.value} alarm updated for ${selectedAssetName.value}.`;
    };
    return {
      assets,
      groups: data.groups,
      users: data.users,
      selectedAssetName,
      alarmName,
      alarmType,
      thresholdRule,
      rateRule,
      logicSelectedTag,
      logicSelectedOperator,
      logicFormula,
      logicOperatorOptions,
      selectedGroups,
      selectedUsers,
      savedMessage,
      assetTagOptions,
      rateUnits,
      insertLogicTag,
      insertLogicOperator,
      updateAlarm,
    };
  },
};
