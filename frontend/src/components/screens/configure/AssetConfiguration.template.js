export const template = `
    <div class="screen">
      <screen-header
        title="Asset Configuration"
        subtitle="Asset, Machines, Data Sources, Tags, and CTags"
      />
      <div v-if="baselineToast" class="inline-alert success">{{ baselineToast }}</div>
      <editable-table
        title="Asset"
        context-title="Current record"
        context-description="Asset row being edited."
        :context-items="assetContextItems"
        :rows="assetRows"
        :columns="assetColumns"
        @update-table="syncConfigurationTables"
      />
      <editable-table
        title="Machines"
        context-title="Equipment rows"
        context-description="Machines and their assigned source systems."
        :context-items="machineContextItems"
        :rows="machineRows"
        :columns="machineColumns"
        :actions="machineDataSourceActions"
        @action="handleMachineTableAction"
        @update-table="updateMachines"
        @cell-change="handleMachineChange"
      />
      <editable-table
        title="Data Sources"
        context-title="Linked sources"
        context-description="Source rows populated from machine assignments."
        :context-items="dataSourceContextItems"
        :rows="dataSourceRows"
        :columns="dataSourceColumns"
        @update-table="syncConfigurationTables"
      />
      <editable-table
        title="Tags"
        context-title="Tag connection scope"
        context-description="Machine/source rows used to connect PLC tags."
        :context-items="tagContextItems"
        :rows="tagRows"
        :columns="tagColumns"
        @action="openTagConnector"
        @update-table="syncConfigurationTables"
      />
      <editable-table
        title="CTags"
        context-title="Calculated tag scope"
        context-description="CTags built from connected source tags."
        :context-items="ctagContextItems"
        :rows="ctagRows"
        :columns="ctagColumns"
        :actions="[{ key: 'create-ctag', label: 'Create CTag' }]"
        @action="openCtagBuilder"
        @update-table="updateCtags"
      />
      <editable-table
        title="Baselines"
        context-title="Automated tag baselines"
        context-description="Choose an asset baseline start and stop time, then calculate low, high, mean, and standard deviation for each tag."
        :context-items="baselineContextItems"
        :rows="baselineRows"
        :columns="baselineColumns"
        :toolbar-controls="baselineDateTimeControls"
        :toolbar-actions="baselineToolbarActions"
        :show-update="false"
        @action="handleBaselineAction"
        @toolbar-change="handleBaselineRangeChange"
        @toolbar-action="handleBaselineToolbarAction"
        @cell-change="handleBaselineChange"
      />
      <div v-if="ctagBuilderOpen" class="modal-layer" role="dialog" aria-modal="true">
        <div class="modal ctag-builder-modal">
          <header class="modal-header">
            <h2>Create CTag Calculation</h2>
            <button type="button" class="icon-button" aria-label="Close" @click="ctagBuilderOpen = false">x</button>
          </header>
          <div class="modal-body">
            <div class="field-grid two">
              <label>
                <span>CTag Name</span>
                <input v-model="ctagDraft.name" />
              </label>
              <label>
                <span>Asset Name</span>
                <input :value="selectedAssetName" readonly />
              </label>
              <label>
                <span>Calculation Type</span>
                <select v-model="ctagDraft.calculationType">
                  <option v-for="option in ctagCalculationOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
              </label>
              <label class="wide">
                <span>Equation Builder</span>
                <div class="ctag-equation-builder">
                  <div v-for="(term, index) in ctagDraft.terms" :key="index" class="ctag-equation-row">
                    <span v-if="index === 0" class="ctag-equation-prefix">CTag =</span>
                    <select v-else v-model="term.operator" aria-label="Operator">
                      <option v-for="option in ctagOperatorOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                    </select>
                    <select v-model="term.tagId" aria-label="Asset tag">
                      <option value=""></option>
                      <option v-for="option in ctagTagOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                    </select>
                  </div>
                  <button type="button" class="secondary" @click="addCtagTerm">Add Term</button>
                </div>
              </label>
              <label class="wide">
                <span>Formula Preview</span>
                <input :value="ctagFormulaPreview" readonly />
              </label>
              <label>
                <span>Units</span>
                <input v-model="ctagDraft.unit" />
              </label>
              <label>
                <span>Sampling</span>
                <input v-model="ctagDraft.samplingRate" />
              </label>
            </div>
            <div class="modal-actions">
              <button type="button" class="secondary" @click="ctagBuilderOpen = false">Cancel</button>
              <button type="button" class="primary" @click="createCtag">Create CTag</button>
            </div>
          </div>
        </div>
      </div>
    </div>
`;
