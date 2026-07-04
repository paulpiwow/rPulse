import { fetchGroups } from "../../api/admin.js";
import { isDataSourceOffline } from "../../api/client.js";

// Notify/assign modal. Notify mode fetches real notification groups from the
// backend when opened; the "sent" payload carries both groupCode and groupName
// so parents can call notifyMaintenanceWarning(groupCode) or
// createMessage({ target: groupName }).
export const ActionModal = {
  props: ["open", "title", "mode", "row"],
  emits: ["close", "assigned", "acknowledged", "sent"],
  data() {
    return {
      assignee: "Operator",
      note: "",
      groupCode: "",
      groups: [],
      groupsLoaded: false,
      loadError: "",
    };
  },
  computed: {
    selectedGroup() {
      return this.groups.find((item) => item.groupId === this.groupCode) || null;
    },
  },
  watch: {
    open(isOpen) {
      if (isOpen && this.mode === "notify") this.loadGroups();
    },
  },
  created() {
    if (this.open && this.mode === "notify") this.loadGroups();
  },
  template: `
    <div v-if="open" class="modal-layer" role="dialog" aria-modal="true">
      <div class="modal">
        <header class="modal-header">
          <h2>{{ title }}</h2>
          <button type="button" class="icon-button" aria-label="Close" @click="$emit('close')">x</button>
        </header>
        <div v-if="mode === 'assign'" class="modal-body">
          <p class="modal-copy">Assignment is required before acknowledgement. Assign responsibility to yourself or another owner before acknowledging this alarm.</p>
          <div class="field-grid two">
            <label>
              <span>Alarm</span>
              <input :value="row?.alarmName || 'Selected alarm'" disabled />
            </label>
            <label>
              <span>Assign To</span>
              <input v-model="assignee" />
            </label>
            <label class="wide">
              <span>Assignment Note</span>
              <textarea v-model="note" rows="3" placeholder="Corrective responsibility before acknowledgement"></textarea>
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" class="secondary" @click="$emit('close')">Cancel</button>
            <button type="button" class="primary" @click="$emit('assigned', { assignee, note })">Assign User</button>
          </div>
        </div>
        <div v-else-if="mode === 'notify'" class="modal-body">
          <p v-if="loadError" class="modal-copy">{{ loadError }}</p>
          <div class="field-grid two">
            <label>
              <span>Target Group</span>
              <select v-model="groupCode">
                <option v-for="item in groups" :key="item.groupId" :value="item.groupId">{{ item.groupName }}</option>
              </select>
            </label>
            <label>
              <span>Delivery</span>
              <input :value="selectedGroup?.delivery || 'Email and SMS where configured'" disabled />
            </label>
            <label class="wide">
              <span>Message</span>
              <textarea v-model="note" rows="3" placeholder="Add context for this notification"></textarea>
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" class="secondary" @click="$emit('close')">Cancel</button>
            <button type="button" class="primary" :disabled="!selectedGroup" @click="sendNotification">Send Notification</button>
          </div>
        </div>
        <div v-else class="modal-body">
          <p class="modal-copy">The selected action completed. Tracking is now available for follow-up ownership.</p>
          <div class="modal-actions">
            <button type="button" class="primary" @click="$emit('acknowledged')">Open Tracking</button>
          </div>
        </div>
      </div>
    </div>
  `,
  methods: {
    async loadGroups() {
      if (this.groupsLoaded) return;
      this.loadError = "";
      try {
        this.groups = await fetchGroups();
        this.groupsLoaded = true;
        if (!this.groupCode && this.groups.length) this.groupCode = this.groups[0].groupId;
      } catch (error) {
        this.loadError = isDataSourceOffline(error)
          ? "Data source offline — live telemetry unavailable"
          : `Unable to load notification groups: ${error.message}`;
      }
    },
    sendNotification() {
      if (!this.selectedGroup) return;
      this.$emit("sent", {
        group: this.selectedGroup.groupName,
        groupName: this.selectedGroup.groupName,
        groupCode: this.selectedGroup.groupId,
        note: this.note,
      });
    },
  },
};

// ScreenHeader provides the in-field breadcrumb trail and screen-level action
// area. The breadcrumb map mirrors the permitted shell tree.
