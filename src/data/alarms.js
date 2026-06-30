import { latestValue, tagName } from "./tags.js";

export const activeAlarms = [
  { alarmEventId: "ALM-CAD-2401", assetName: "EMIT DCT Panel", location: "Compressor Skid", alarmName: "Final Discharge Temperature High", severity: "red", tripTime: "17:06", duration: "19 min", assignment: "Compressor Operations", acknowledgement: "Pending", tracking: "Open" },
  { alarmEventId: "ALM-CAD-2402", assetName: "Engine ECU Gateway", location: "Compressor Skid", alarmName: "Engine Vibration Near Danger", severity: "red", tripTime: "17:11", duration: "14 min", assignment: "Cadre Reliability", acknowledgement: "Pending", tracking: "Open" },
  { alarmEventId: "ALM-CAD-2403", assetName: "EMIT DCT Panel", location: "Compressor Skid", alarmName: "Suction Temperature Low", severity: "yellow", tripTime: "17:16", duration: "9 min", assignment: "Unassigned", acknowledgement: "Blocked", tracking: "Not Started" },
  { alarmEventId: "ALM-CAD-2404", assetName: "EMIT DCT Panel", location: "Compressor Skid", alarmName: "Final Discharge Pressure Below Load Curve", severity: "yellow", tripTime: "17:18", duration: "7 min", assignment: "Compressor Operations", acknowledgement: "Blocked", tracking: "Not Started" },
  { alarmEventId: "ALM-CAD-2405", assetName: "Engine ECU Gateway", location: "Compressor Skid", alarmName: "Jacket Water Temperature High", severity: "yellow", tripTime: "17:21", duration: "4 min", assignment: "Engine Reliability", acknowledgement: "Blocked", tracking: "Not Started" },
];

export const alarmDetails = [
  { tagName: "Final Discharge Temp", tagType: "Tag", condition: "Greater Than", value: 240, unit: "F", time: "17:06", duration: "19 min", currentValue: latestValue("final-dis-temp"), lastSync: "17:25" },
  { tagName: "Engine Vibration", tagType: "Tag", condition: "Greater Than", value: 0.8, unit: "IPS", time: "17:11", duration: "14 min", currentValue: latestValue("vib-engine"), lastSync: "17:25" },
  { tagName: "Suction Temp", tagType: "Tag", condition: "Less Than", value: 35, unit: "F", time: "17:16", duration: "9 min", currentValue: latestValue("suct-temp"), lastSync: "17:25" },
  { tagName: "Final Discharge Press", tagType: "Tag", condition: "Less Than", value: 900, unit: "PSI", time: "17:18", duration: "7 min", currentValue: latestValue("final-dis-press"), lastSync: "17:25" },
  { tagName: "Jacket Water Temp", tagType: "Tag", condition: "Greater Than", value: 205, unit: "F", time: "17:21", duration: "4 min", currentValue: latestValue("eng-jw-temp"), lastSync: "17:25" },
];

export const alarmHistory = [
  { alarmEventId: "ALM-CAD-2388", assetName: "Cooler Fan VFD", location: "Compressor Skid", alarmName: "Cooler Fan Speed Low", tripTime: "2026-06-17 16:36", notificationTime: "2026-06-17 16:37", acknowledgeTime: "2026-06-17 16:44", duration: "22 min", responsibility: "Compressor Operations", status: "Resolved" },
  { alarmEventId: "ALM-CAD-2394", assetName: "Product Link Telematics", location: "Compressor Skid", alarmName: "Battery Voltage Sag", tripTime: "2026-06-17 16:51", notificationTime: "2026-06-17 16:52", acknowledgeTime: "2026-06-17 16:59", duration: "18 min", responsibility: "Automation Support", status: "Reviewed" },
  { alarmEventId: "ALM-CAD-2399", assetName: "EMIT DCT Panel", location: "Compressor Skid", alarmName: "Recycle Valve Position Deviation", tripTime: "2026-06-17 17:02", notificationTime: "2026-06-17 17:02", acknowledgeTime: "2026-06-17 17:10", duration: "23 min", responsibility: "Compressor Operations", status: "Resolved" },
  ...activeAlarms.map((alarm) => ({
    ...alarm,
    tripTime: `2026-06-17 ${alarm.tripTime}`,
    notificationTime: `2026-06-17 ${alarm.tripTime}`,
    acknowledgeTime: alarm.acknowledgement === "Pending" ? "" : "Blocked",
    responsibility: alarm.assignment,
    status: alarm.tracking,
  })),
];
