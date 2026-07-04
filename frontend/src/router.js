import { AppShell } from "./components/AppShell.js";
import { LoginScreen } from "./components/screens/LoginScreen.js";
import { LicenseManagement } from "./components/screens/admin/LicenseManagement.js";
import { MessageCenter } from "./components/screens/admin/MessageCenter.js";
import { UserAdmin } from "./components/screens/admin/UserAdmin.js";
import { AlarmConfiguration } from "./components/screens/configure/AlarmConfiguration.js";
import { AlarmList } from "./components/screens/configure/AlarmList.js";
import { AssetConfiguration } from "./components/screens/configure/AssetConfiguration.js";
import { AssetInventory } from "./components/screens/configure/AssetInventory.js";
import { ConnectTags } from "./components/screens/configure/ConnectTags.js";
import { GroupList } from "./components/screens/configure/GroupList.js";
import { ActiveAlarms } from "./components/screens/operate/ActiveAlarms.js";
import { AlarmDataTrends } from "./components/screens/operate/AlarmDataTrends.js";
import { AlarmHistory } from "./components/screens/operate/AlarmHistory.js";
import { AlarmHistoryDetail } from "./components/screens/operate/AlarmHistoryDetail.js";
import { AssetAlarmDetail } from "./components/screens/operate/AssetAlarmDetail.js";
import { BaselineDeviations } from "./components/screens/operate/BaselineDeviations.js";
import { DataDeviationTrends } from "./components/screens/operate/DataDeviationTrends.js";
import { SiteStatus } from "./components/screens/operate/SiteStatus.js";
import { FormScreen } from "./components/shared/FormScreen.js";
import {
  createGroup,
  createUser,
  fetchGroups,
  fetchLicense,
  fetchUser,
  fetchUserGroups,
  fetchUsers,
  saveLicense,
  setUserGroups,
  updateGroup,
  updateUser,
} from "./api/admin.js";
import { api } from "./api/client.js";
import { createAsset, fetchAssets } from "./api/hierarchy.js";
import { createRouter, createWebHashHistory } from "./lib/vue.js";

// The backend allocates no codes — generate PREFIX-### client-side, collision
// checked against the codes already fetched from the backend.
export function nextCode(prefix, existingCodes) {
  const used = new Set(existingCodes);
  let next = 1;
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  existingCodes.forEach((code) => {
    const match = pattern.exec(code || "");
    if (match) next = Math.max(next, Number(match[1]) + 1);
  });
  let candidate = `${prefix}-${String(next).padStart(3, "0")}`;
  while (used.has(candidate)) {
    next += 1;
    candidate = `${prefix}-${String(next).padStart(3, "0")}`;
  }
  return candidate;
}

const ROLE_OPTIONS = ["Viewer", "Operator", "Maintenance / Reliability", "Configurator", "System Administrator"];
const RENEWAL_STATUS_OPTIONS = ["Not Started", "Requested", "Pending Approval", "Renewed"];

export function formRoute(name, title, subtitle, fields, primaryLabel = "Save", handlers = {}) {
  return {
    path: "/" + name,
    name,
    component: FormScreen,
    meta: { title },
    props: { title, subtitle, fields, primaryLabel, load: handlers.load, onSubmit: handlers.onSubmit },
  };
}

// Route registration is intentionally limited to the screens associated with
// the Clean Shell tree and the required workflow detail states.

export const routes = [
  { path: "/", redirect: "/login" },
  { path: "/login", name: "login", component: LoginScreen, meta: { public: true, title: "Login" } },
  { path: "/site-status", name: "site-status", component: SiteStatus, meta: { title: "Site Status", group: "Operate" } },
  { path: "/active-alarms", name: "active-alarms", component: ActiveAlarms, meta: { title: "Active Alarms", group: "Operate" } },
  { path: "/asset-alarm-detail", name: "asset-alarm-detail", component: AssetAlarmDetail, meta: { title: "Asset Alarm Detail", group: "Operate" } },
  { path: "/alarm-data-trends", name: "alarm-data-trends", component: AlarmDataTrends, meta: { title: "Alarm Data Trends", group: "Operate" } },
  { path: "/alarm-history", name: "alarm-history", component: AlarmHistory, meta: { title: "Alarm History", group: "Operate" } },
  { path: "/alarm-history-detail", name: "alarm-history-detail", component: AlarmHistoryDetail, meta: { title: "Alarm History Detail", group: "Operate" } },
  { path: "/baseline-deviations", name: "baseline-deviations", component: BaselineDeviations, meta: { title: "Maintenance Warnings", group: "Operate" } },
  { path: "/data-deviation-trends", name: "data-deviation-trends", component: DataDeviationTrends, meta: { title: "Maintenance Warning Trend", group: "Operate" } },
  { path: "/asset-inventory", name: "asset-inventory", component: AssetInventory, meta: { title: "Asset Inventory", group: "Configure" } },
  { path: "/asset-configuration", name: "asset-configuration", component: AssetConfiguration, meta: { title: "Asset Configuration", group: "Configure" } },
  { path: "/connect-tags", name: "connect-tags", component: ConnectTags, meta: { title: "Connect Tags", group: "Configure" } },
  { path: "/alarm-list", name: "alarm-list", component: AlarmList, meta: { title: "Alarm List", group: "Configure" } },
  { path: "/alarm-configuration", name: "alarm-configuration", component: AlarmConfiguration, meta: { title: "Alarm Configuration", group: "Configure" } },
  {
    path: "/group-list",
    name: "group-list",
    component: GroupList,
    meta: { title: "Group List", group: "Configure" },
  },
  {
    path: "/license-management",
    name: "license-management",
    component: LicenseManagement,
    meta: { title: "Application", group: "Admin" },
  },
  { path: "/user-admin", name: "user-admin", component: UserAdmin, meta: { title: "Users", group: "Admin" } },
  { path: "/message-center", name: "message-center", component: MessageCenter, meta: { title: "Messages", group: "Admin" } },
  formRoute("new-asset", "New Asset", "Full-screen add asset flow from the matrix", [
    { label: "Asset ID", name: "assetId", placeholder: "Blank to auto-generate (AST-###)" },
    { label: "Asset Name", name: "assetName", placeholder: "Enter asset name" },
    { label: "Asset Location", name: "location", placeholder: "Physical site location" },
    { label: "Asset Type", name: "assetType", placeholder: "Line, skid, process area" },
    { label: "Initial Status", name: "initialStatus", type: "select", options: ["Active", "Disabled", "Commissioning"], value: "Active" },
    { label: "Baseline Required", name: "baselineRequired", type: "select", options: ["Yes", "No"], value: "Yes" },
    { label: "Notes", name: "description", type: "textarea", placeholder: "Configuration notes" },
  ], "Create Asset", {
    async onSubmit(values) {
      const [assets, sites] = await Promise.all([fetchAssets(), api.get("/sites")]);
      const code = (values.assetId || "").trim() || nextCode("AST", assets.map((asset) => asset.assetId));
      await createAsset({
        code,
        assetName: values.assetName,
        location: values.location,
        assetType: values.assetType,
        description: values.description,
        enabled: values.initialStatus !== "Disabled",
        baselineRequired: values.baselineRequired !== "No",
        site: sites.length ? { id: sites[0].id } : null,
      });
      return "asset-inventory";
    },
  }),
  formRoute("group-configuration", "Group Configuration", "Selected group configuration and group members", [
    { label: "Group Name", name: "groupName", placeholder: "Enter group name" },
    { label: "Purpose", name: "purpose", wide: true, placeholder: "What this group responds to" },
    { label: "Delivery Methods", name: "delivery", type: "select", options: ["Email", "SMS", "Email, SMS"], value: "Email" },
    { label: "Active", name: "active", type: "select", options: ["Yes", "No"], value: "Yes" },
    { label: "Notes", name: "notes", type: "textarea" },
  ], "Save Group", {
    async load(route) {
      if (!route.query.group) return {};
      const group = (await fetchGroups()).find((item) => item.groupId === route.query.group);
      if (!group) return {};
      return {
        groupName: group.groupName,
        purpose: group.purpose,
        delivery: group.delivery,
        active: group.active,
        notes: group.notes,
      };
    },
    async onSubmit(values, route) {
      const payload = {
        groupName: values.groupName,
        purpose: values.purpose,
        delivery: values.delivery,
        active: values.active !== "No",
        notes: values.notes,
      };
      const code = route.query.group;
      if (code) {
        await updateGroup(code, { code, ...payload });
      } else {
        const generated = nextCode("GRP", (await fetchGroups()).map((group) => group.groupId));
        await createGroup({ code: generated, ...payload });
      }
    },
  }),
  formRoute("renewal-workflow", "Renewal Workflow", "Application renewal workflow", [
    { label: "Current License", name: "code", readonly: true },
    { label: "Renewal Status", name: "renewalStatus", type: "select", options: RENEWAL_STATUS_OPTIONS, value: "Requested" },
    { label: "Customer Contact", name: "customerContact", placeholder: "Renewal contact" },
    { label: "Requested Term", name: "requestedTerm", type: "select", options: ["12 months", "24 months", "36 months"], value: "12 months" },
    { label: "Renewal Note", name: "renewalNote", type: "textarea", wide: true },
  ], "Submit Renewal", {
    async load() {
      const license = await fetchLicense();
      if (!license) return { code: "LIC-001" };
      return {
        code: license.code,
        renewalStatus: license.renewalStatus || "Requested",
        customerContact: license.customerContact,
        requestedTerm: license.requestedTerm,
        renewalNote: license.renewalNote,
      };
    },
    async onSubmit(values) {
      const existing = await fetchLicense();
      await saveLicense({
        code: existing?.code || values.code || "LIC-001",
        customerName: existing?.customerName || "",
        startDate: existing?.startDate || "",
        endDate: existing?.endDate || "",
        status: "Renewal Pending",
        renewalStatus: values.renewalStatus || "Requested",
        customerContact: values.customerContact,
        requestedTerm: values.requestedTerm,
        renewalNote: values.renewalNote,
      });
      return "license-management";
    },
  }),
  formRoute("edit-user", "Edit User", "User information and authority update", [
    { label: "User Name", name: "userName", placeholder: "Full name" },
    { label: "Email", name: "email", placeholder: "name@company.com" },
    { label: "Phone / SMS", name: "phone", placeholder: "+1 555 0100" },
    { label: "Role", name: "role", type: "select", options: ROLE_OPTIONS, value: "Viewer" },
    { label: "Active", name: "active", type: "select", options: ["Yes", "No"], value: "Yes" },
    { label: "Notification Preferences", name: "notificationPrefs", type: "select", options: ["Email", "SMS", "Email, SMS"], value: "Email" },
    { label: "Groups", name: "groups", type: "multiselect", options: [], wide: true },
  ], "Update User", {
    async load(route) {
      const groups = await fetchGroups();
      const options = {
        groups: groups.map((group) => ({ value: group.groupId, label: `${group.groupName} (${group.groupId})` })),
      };
      const code = route.query.user;
      if (!code) return { values: {}, options };
      const [user, memberships] = await Promise.all([fetchUser(code), fetchUserGroups(code)]);
      return {
        values: {
          userName: user.userName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          active: user.status === "Active" ? "Yes" : "No",
          notificationPrefs: user.notifications || "Email",
          groups: memberships.map((group) => group.groupId),
        },
        options,
      };
    },
    async onSubmit(values, route) {
      const prefs = values.notificationPrefs || "";
      const payload = {
        userName: values.userName,
        email: values.email,
        phone: values.phone,
        role: values.role,
        active: values.active !== "No",
        notificationPrefs: prefs,
        emailNotifications: prefs.includes("Email"),
        smsNotifications: prefs.includes("SMS"),
      };
      let code = route.query.user;
      if (code) {
        await updateUser(code, { code, ...payload });
      } else {
        code = nextCode("USR", (await fetchUsers()).map((user) => user.userId));
        await createUser({ code, ...payload });
      }
      await setUserGroups(code, values.groups || []);
    },
  }),
  { path: "/:pathMatch(.*)*", redirect: "/site-status" },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// AppShell is the exact persistent frame: left navigation, top status bar,
// and the scrollable field area. Screen components render only inside it.
