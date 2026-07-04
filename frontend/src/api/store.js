// Tiny shared store for cross-screen state — the nav badge counts in
// AppShell.js (active alarms, maintenance warnings, unread messages) are read
// outside any screen. The shell refreshes it on navigation and on a timer;
// screens may also call refreshStore() after mutations (ack, clear, notify).
import { reactive } from "../lib/vue.js";
import { fetchMessages } from "./admin.js";
import { fetchActiveAlarms, fetchMaintenanceWarnings } from "./alarms.js";

export const store = reactive({
  activeAlarms: [],
  maintenanceWarnings: [],
  unreadMessageCount: 0,
  backendUp: true,
  lastRefreshed: null,
});

let inFlight = null;

export function refreshStore() {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const [alarms, warnings, messages] = await Promise.allSettled([
      fetchActiveAlarms(),
      fetchMaintenanceWarnings(),
      fetchMessages(),
    ]);
    if (alarms.status === "fulfilled") store.activeAlarms = alarms.value;
    if (warnings.status === "fulfilled") store.maintenanceWarnings = warnings.value;
    if (messages.status === "fulfilled") {
      store.unreadMessageCount = messages.value.filter((m) => m.status === "Unread").length;
    }
    store.backendUp = [alarms, warnings, messages].some((r) => r.status === "fulfilled");
    store.lastRefreshed = new Date();
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
