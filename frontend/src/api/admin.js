// Admin domain: notification groups, users (+ group membership), system
// messages (Message Center), and the singleton app license.
import { api, formatDateTime, isNotFound } from "./client.js";

// --- notification groups ---------------------------------------------------------

export function mapGroup(group) {
  return {
    groupId: group.code,
    groupName: group.groupName,
    purpose: group.purpose,
    delivery: group.delivery,
    active: group.active ? "Yes" : "No",
    notes: group.notes,
    // membership lives on the user side (GET /users/{code}/groups);
    // the group entity carries no member list
    members: "",
  };
}

export async function fetchGroups() {
  return (await api.get("/groups")).map(mapGroup);
}

export function createGroup(group) {
  return api.post("/groups", group);
}

export function updateGroup(code, group) {
  return api.put(`/groups/${encodeURIComponent(code)}`, group);
}

export function deleteGroup(code) {
  return api.del(`/groups/${encodeURIComponent(code)}`);
}

// --- users ------------------------------------------------------------------------

export function mapUser(user) {
  return {
    userId: user.code,
    userName: user.userName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.active ? "Active" : "Disabled",
    notifications: user.notificationPrefs || "",
    emailNotifications: user.emailNotifications,
    smsNotifications: user.smsNotifications,
  };
}

export async function fetchUsers() {
  return (await api.get("/users")).map(mapUser);
}

export async function fetchUser(code) {
  return mapUser(await api.get(`/users/${encodeURIComponent(code)}`));
}

export function createUser(user) {
  return api.post("/users", user);
}

export function updateUser(code, user) {
  return api.put(`/users/${encodeURIComponent(code)}`, user);
}

export function deleteUser(code) {
  return api.del(`/users/${encodeURIComponent(code)}`);
}

export async function fetchUserGroups(code) {
  return (await api.get(`/users/${encodeURIComponent(code)}/groups`)).map(mapGroup);
}

// Replaces the user's group memberships; body is an array of group codes.
export async function setUserGroups(code, groupCodes) {
  return (await api.put(`/users/${encodeURIComponent(code)}/groups`, groupCodes)).map(mapGroup);
}

// --- messages ----------------------------------------------------------------------

export function mapMessage(message) {
  return {
    messageId: message.code,
    title: message.title,
    body: message.body,
    source: message.source,
    target: message.target || "",
    createdAt: formatDateTime(message.createdAt),
    status: message.status,
    acknowledgedAt: message.acknowledgedAt ? formatDateTime(message.acknowledgedAt) : "",
  };
}

export async function fetchMessages() {
  return (await api.get("/messages")).map(mapMessage);
}

// Allowed source values: ALARM, MANUAL, SYSTEM, MAINTENANCE_WARNING, ALARM_STATUS.
// Used directly by the alarm screens' "Notify Group" actions (the backend only
// has a dedicated notify endpoint for maintenance warnings). The backend never
// allocates business codes (code is NOT NULL), so one is generated here.
export function createMessage({ title, body, source = "MANUAL", target }) {
  const code = `MSG-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  return api.post("/messages", { code, title, body, source, target, status: "Unread" });
}

export async function acknowledgeMessage(code) {
  return mapMessage(await api.post(`/messages/${encodeURIComponent(code)}/ack`));
}

export function deleteMessage(code) {
  return api.del(`/messages/${encodeURIComponent(code)}`);
}

// --- license (singleton) --------------------------------------------------------------

export function mapLicense(license) {
  return {
    code: license.code,
    customerName: license.customerName,
    status: license.status,
    startDate: license.startDate,
    endDate: license.endDate,
    renewalStatus: license.renewalStatus || "",
    customerContact: license.customerContact || "",
    requestedTerm: license.requestedTerm || "",
    renewalNote: license.renewalNote || "",
  };
}

// 404 until a license record has been set — returns null in that case.
export async function fetchLicense() {
  try {
    return mapLicense(await api.get("/license"));
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

// Overwrites the single license row (creates it if absent).
export async function saveLicense(license) {
  return mapLicense(await api.put("/license", license));
}
