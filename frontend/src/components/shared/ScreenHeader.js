import { StatusBadge } from "./StatusBadge.js";
import { data } from "../../data/index.js";
import { themeState } from "../../lib/state.js";

export const ScreenHeader = {
  props: ["title", "subtitle", "status", "actions"],
  components: { StatusBadge },
  emits: ["action"],
  setup() {
    return { themeState };
  },
  computed: {
    visibleActions() {
      return this.actions || [];
    },
    crumbs() {
      const routeName = this.$route.name;
      const map = {
        "site-status": [{ label: "Operate", route: "site-status" }, { label: "Site Status" }],
        "active-alarms": [{ label: "Operate", route: "site-status" }, { label: "Active Alarms" }],
        "asset-alarm-detail": [
          { label: "Operate", route: "site-status" },
          { label: "Active Alarms", route: "active-alarms" },
          { label: "Asset Alarm Detail" },
        ],
        "alarm-data-trends": [
          { label: "Operate", route: "site-status" },
          { label: "Active Alarms", route: "active-alarms" },
          { label: "Asset Alarm Detail", route: "asset-alarm-detail" },
          { label: "Alarm Data Trends" },
        ],
        "alarm-history": [{ label: "Operate", route: "site-status" }, { label: "Alarm History" }],
        "alarm-history-detail": [
          { label: "Operate", route: "site-status" },
          { label: "Alarm History", route: "alarm-history" },
          { label: "Alarm History Detail" },
        ],
        "baseline-deviations": [{ label: "Operate", route: "site-status" }, { label: "Maintenance Warnings" }],
        "data-deviation-trends": [
          { label: "Operate", route: "site-status" },
          { label: "Maintenance Warnings", route: "baseline-deviations" },
          { label: "Maintenance Warning Trend" },
        ],
        "asset-inventory": [{ label: "Configure", route: "asset-inventory" }, { label: "Assets" }],
        "asset-configuration": [
          { label: "Configure", route: "asset-inventory" },
          { label: "Assets", route: "asset-inventory" },
          { label: "Asset Configuration" },
        ],
        "connect-tags": [
          { label: "Configure", route: "asset-inventory" },
          { label: "Assets", route: "asset-inventory" },
          { label: "Asset Configuration", route: "asset-configuration" },
          { label: "Connect Tags" },
        ],
        "alarm-list": [{ label: "Configure", route: "asset-inventory" }, { label: "Alarms" }],
        "alarm-configuration": [
          { label: "Configure", route: "asset-inventory" },
          { label: "Alarms", route: "alarm-list" },
          { label: "Alarm Configuration" },
        ],
        "group-list": [{ label: "Configure", route: "asset-inventory" }, { label: "Groups" }],
        "group-configuration": [
          { label: "Configure", route: "asset-inventory" },
          { label: "Groups", route: "group-list" },
          { label: "Group Configuration" },
        ],
        "license-management": [{ label: "Admin", route: "license-management" }, { label: "Application" }],
        "renewal-workflow": [
          { label: "Admin", route: "license-management" },
          { label: "Application", route: "license-management" },
          { label: "Renewal Workflow" },
        ],
        "user-admin": [{ label: "Admin", route: "license-management" }, { label: "Users" }],
        "edit-user": [
          { label: "Admin", route: "license-management" },
          { label: "Users", route: "user-admin" },
          { label: "Edit User" },
        ],
        "message-center": [{ label: "Admin", route: "license-management" }, { label: "Messages" }],
      };
      return map[routeName] || [];
    },
  },
  methods: {
    toggleDarkMode() {
      themeState.darkMode = !themeState.darkMode;
    },
  },
  template: `
    <header class="screen-header">
      <div class="breadcrumb-row">
        <nav class="sub-breadcrumbs" aria-label="Screen breadcrumb">
          <template v-for="(crumb, index) in crumbs" :key="crumb.label">
            <router-link v-if="crumb.route" :to="{ name: crumb.route }">{{ crumb.label }}</router-link>
            <span v-else>{{ crumb.label }}</span>
            <i v-if="index < crumbs.length - 1">></i>
          </template>
        </nav>
        <button type="button" class="theme-toggle" :aria-pressed="themeState.darkMode" @click="toggleDarkMode">
          <span class="toggle-track" aria-hidden="true"><span class="toggle-thumb"></span></span>
          <span>Dark Mode</span>
        </button>
      </div>
      <div v-if="visibleActions.length" class="screen-actions">
        <button v-for="action in visibleActions" :key="action.key" type="button" :class="action.kind || 'secondary'" @click="$emit('action', action)">
          {{ action.label }}
        </button>
      </div>
    </header>
  `,
};
