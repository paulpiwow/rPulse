import { ScreenHeader } from "./ScreenHeader.js";
import { data } from "../../data/index.js";

export const ActionModal = {
  props: ["open", "title", "mode", "row"],
  emits: ["close", "assigned", "acknowledged", "sent"],
  data() {
    return {
      assignee: data.users[1]?.userName || data.users[0]?.userName || "Operator",
      note: "",
      group: data.groups[0]?.groupName || "Response Group",
      users: data.users,
      groups: data.groups,
    };
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
              <select v-model="assignee">
                <option v-for="user in users" :key="user.userId">{{ user.userName }}</option>
              </select>
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
          <div class="field-grid two">
            <label>
              <span>Target Group</span>
              <select v-model="group">
                <option v-for="item in groups" :key="item.groupId">{{ item.groupName }}</option>
              </select>
            </label>
            <label>
              <span>Delivery</span>
              <input value="Email and SMS where configured" disabled />
            </label>
            <label class="wide">
              <span>Message</span>
              <textarea v-model="note" rows="3" placeholder="Add context for this notification"></textarea>
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" class="secondary" @click="$emit('close')">Cancel</button>
            <button type="button" class="primary" @click="$emit('sent', { group, note })">Send Notification</button>
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
};

// ScreenHeader provides the in-field breadcrumb trail and screen-level action
// area. The breadcrumb map mirrors the permitted shell tree.
