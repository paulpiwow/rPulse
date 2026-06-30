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
import { data } from "./data/index.js";
import { createRouter, createWebHashHistory } from "./lib/vue.js";

export function formRoute(name, title, subtitle, fields, primaryLabel = "Save") {
  return {
    path: "/" + name,
    name,
    component: FormScreen,
    meta: { title },
    props: { title, subtitle, fields, primaryLabel },
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
    { label: "Asset Name", placeholder: "Enter asset name" },
    { label: "Asset Location", placeholder: "Physical site location" },
    { label: "Asset Type", placeholder: "Line, skid, process area" },
    { label: "Initial Status", type: "select", options: ["Active", "Disabled", "Commissioning"] },
    { label: "Baseline Required", type: "select", options: ["Yes", "No"] },
    { label: "Notes", type: "textarea", placeholder: "Configuration notes" },
  ], "Create Asset"),
  formRoute("group-configuration", "Group Configuration", "Selected group configuration and group members", [
    { label: "Group Name", value: "Compressor Operations" },
    { label: "Purpose", value: "First response for Cadre compressor process alarms", wide: true },
    { label: "Members", value: "Maya Singh, Owen Carter" },
    { label: "Delivery Methods", type: "select", options: ["Email and SMS", "Email", "SMS"] },
    { label: "Active", type: "select", options: ["Yes", "No"] },
    { label: "Notes", type: "textarea" },
  ], "Save Group"),
  formRoute("renewal-workflow", "Renewal Workflow", "Application renewal workflow", [
    { label: "Current License", value: "LIC-0001" },
    { label: "Renewal Status", type: "select", options: ["Not Started", "Requested", "Pending Approval", "Renewed"] },
    { label: "Customer Contact", value: "Cadre Demo Manager" },
    { label: "Requested Term", type: "select", options: ["12 months", "24 months", "36 months"] },
    { label: "Renewal Note", type: "textarea" },
  ], "Submit Renewal"),
  formRoute("edit-user", "Edit User", "User information and authority update", [
    { label: "User Name", value: "Maya Singh" },
    { label: "Email", value: "maya.singh@cadre-demo.local" },
    { label: "Phone / SMS", value: "+1 555 0102" },
    { label: "Role", type: "select", options: ["Viewer", "Operator", "Maintenance / Reliability", "Configurator", "System Administrator"] },
    { label: "Active", type: "select", options: ["Yes", "No"] },
    { label: "Notification Preferences", value: "SMS" },
  ], "Update User"),
  { path: "/:pathMatch(.*)*", redirect: "/site-status" },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// AppShell is the exact persistent frame: left navigation, top status bar,
// and the scrollable field area. Screen components render only inside it.
