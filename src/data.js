// Static prototype data mirrors the Cadre asset-simulator API closely enough to
// exercise rhoPulse screens without live plant services.
window.RPULSE_DATA = (() => {
  const pad = (value) => String(value).padStart(2, "0");
  const formatClock = (date) => `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
  const formatStamp = (date) =>
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;

  const trendEnd = new Date(Date.UTC(2026, 5, 17, 17, 25, 24));
  const minuteCount = 7 * 24 * 60;
  const trendMinuteTimes = Array.from({ length: minuteCount }, (_, index) => {
    const date = new Date(trendEnd.getTime() - (minuteCount - 1 - index) * 60000);
    return date.toISOString();
  });

  const run = {
    runId: "run-d7a5dd0f0fba",
    startedAt: "2026-06-17T17:10:24.839666Z",
    stoppedAt: "2026-06-17T17:25:27.557537Z",
    stopReason: "raw_stop_limit",
    elapsedSeconds: 902.717881,
    generatedSamples: 317780,
    generatedPoints: 86570,
    writtenPoints: 86570,
    writeRate: 95.96079211187791,
    storageBytes: 78233542,
    rawWarningSeconds: 840,
    rawStopSeconds: 900,
  };

  const shell = {
    productName: "\u03c1Pulse",
    siteName: "Cadre Compressor Skid Demo",
    siteLocation: "Cadre Compressor Skid",
    userName: "Cody, Admin",
    version: "v1.0",
    company: "Rhobot Ai Solutions, Inc.",
    syncAge: "14s",
    status: "green",
  };

  const navSections = [
    {
      label: "Operate",
      items: [
        { label: "Site Status", route: "site-status", icon: "status", status: "green" },
        { label: "Active Alarms", route: "active-alarms", icon: "alarm", count: 5, status: "red" },
        { label: "Alarm History", route: "alarm-history", icon: "history" },
        { label: "Maintenance Warnings", route: "baseline-deviations", icon: "deviation", count: 7, status: "yellow" },
      ],
    },
    {
      label: "Configure",
      items: [
        { label: "Assets", route: "asset-inventory", icon: "asset" },
        { label: "Alarms", route: "alarm-list", icon: "bell" },
        { label: "Groups", route: "group-list", icon: "groups" },
      ],
    },
    {
      label: "Admin",
      items: [
        { label: "Application", route: "license-management", icon: "application" },
        { label: "Users", route: "user-admin", icon: "user" },
        { label: "Messages", route: "message-center", icon: "message", count: 2 },
      ],
    },
  ];

  const assets = [
    {
      assetId: "asset-simulator",
      assetName: "Cadre Compressor Skid",
      location: "Compressor Skid",
      status: "red",
      activeAlarms: 2,
      baselineDeviations: 3,
      assignedTo: "Cadre Reliability",
      lastUpdate: "17:25",
      description: "Local process data generator and compressor package used for the Cadre rhoPulse demo.",
    },
    {
      assetId: "AST-DCT",
      assetName: "EMIT DCT Panel",
      location: "Compressor Skid",
      status: "red",
      activeAlarms: 2,
      baselineDeviations: 2,
      assignedTo: "Compressor Operations",
      lastUpdate: "17:25",
      description: "EMIT Dynamic Control Touchscreen compressor panel with Modbus TCP process values.",
    },
    {
      assetId: "AST-ECU",
      assetName: "Engine ECU Gateway",
      location: "Compressor Skid",
      status: "yellow",
      activeAlarms: 1,
      baselineDeviations: 1,
      assignedTo: "Engine Reliability",
      lastUpdate: "17:25",
      description: "CAT ADEM engine ECU gateway mirrored into the simulator data stream.",
    },
    {
      assetId: "AST-PLT",
      assetName: "Product Link Telematics",
      location: "Compressor Skid",
      status: "green",
      activeAlarms: 0,
      baselineDeviations: 0,
      assignedTo: "Automation Support",
      lastUpdate: "17:25",
      description: "CAT Product Link Elite MQTT feed for battery voltage and engine-hour counters.",
    },
    {
      assetId: "AST-VFD",
      assetName: "Cooler Fan VFD",
      location: "Compressor Skid",
      status: "yellow",
      activeAlarms: 0,
      baselineDeviations: 1,
      assignedTo: "Compressor Operations",
      lastUpdate: "17:25",
      description: "Aerial cooler fan drive publishing suction pressure and cooler fan speed.",
    },
    {
      assetId: "AST-VIB",
      assetName: "Vibration Sensor Network",
      location: "Compressor Skid",
      status: "yellow",
      activeAlarms: 0,
      baselineDeviations: 1,
      assignedTo: "Cadre Reliability",
      lastUpdate: "17:25",
      description: "EMIT vibration sensor network mapped to DCT vibration registers.",
    },
  ];

  const machines = [
    { machineId: "MCH-001", assetName: "Cadre Compressor Skid", machineName: "Compressor Package", location: "Compressor Skid", type: "Package", description: "Overall compressor skid and simulator run context." },
    { machineId: "MCH-002", assetName: "EMIT DCT Panel", machineName: "EMIT DCT Panel", location: "Compressor Skid", type: "PLC", description: "EMIT DCT Modbus TCP source for process pressures, temperatures, and state." },
    { machineId: "MCH-003", assetName: "Engine ECU Gateway", machineName: "Engine ECU Gateway", location: "Compressor Skid", type: "PLC", description: "CAT ADEM ECU gateway exposing engine speed, load, oil pressure, and jacket water temperature." },
    { machineId: "MCH-004", assetName: "Product Link Telematics", machineName: "Product Link Telematics", location: "Compressor Skid", type: "Historian", description: "MQTT telematics feed for battery voltage and engine-hour counters." },
    { machineId: "MCH-005", assetName: "Cooler Fan VFD", machineName: "Cooler Fan VFD", location: "Compressor Skid", type: "VFD", description: "Aerial cooler fan drive and suction pressure source." },
    { machineId: "MCH-006", assetName: "Vibration Sensor Network", machineName: "Vibration Sensors", location: "Compressor Skid", type: "Sensor", description: "Engine and compressor vibration sensor network." },
  ];

  const dataSources = [
    { dataSourceId: "DS-001", machineName: "EMIT DCT Panel", sourceName: "EMIT DCT Panel", sourceType: "PLC", protocol: "MODBUS TCP", location: "Compressor Skid", networkAddress: "tcp://0.0.0.0:1502", status: "green" },
    { dataSourceId: "DS-002", machineName: "Engine ECU Gateway", sourceName: "Engine ECU Gateway", sourceType: "PLC", protocol: "OPC UA", location: "Compressor Skid", networkAddress: "opc.tcp://0.0.0.0:4840", status: "yellow" },
    { dataSourceId: "DS-003", machineName: "Product Link Telematics", sourceName: "Product Link Telematics", sourceType: "Historian", protocol: "MQTT", location: "Compressor Skid", networkAddress: "mqtt://mosquitto:1883", status: "green" },
    { dataSourceId: "DS-004", machineName: "Cooler Fan VFD", sourceName: "Cooler Fan VFD", sourceType: "VFD", protocol: "PROFINET", location: "Compressor Skid", networkAddress: "udp://pn-gateway:34962", status: "yellow" },
    { dataSourceId: "DS-005", machineName: "Vibration Sensors", sourceName: "Vibration Sensors", sourceType: "Sensor", protocol: "MODBUS TCP", location: "Compressor Skid", networkAddress: "tcp://0.0.0.0:1502", status: "green" },
  ];

  const sourceNameById = {
    "dct-panel": "EMIT DCT Panel",
    "adem-gateway": "Engine ECU Gateway",
    "ple-telematics": "Product Link Telematics",
    "cooler-vfd": "Cooler Fan VFD",
    "vib-network": "Vibration Sensors",
  };

  const machineBySourceId = {
    "dct-panel": "EMIT DCT Panel",
    "adem-gateway": "Engine ECU Gateway",
    "ple-telematics": "Product Link Telematics",
    "cooler-vfd": "Cooler Fan VFD",
    "vib-network": "Vibration Sensors",
  };

  const assetBySourceId = {
    "dct-panel": "EMIT DCT Panel",
    "adem-gateway": "Engine ECU Gateway",
    "ple-telematics": "Product Link Telematics",
    "cooler-vfd": "Cooler Fan VFD",
    "vib-network": "Vibration Sensor Network",
  };

  const tagColors = {
    "suct-press": "#1e3a8a",
    "suct-temp": "#9a3412",
    "stg1-dis-press": "#1d4ed8",
    "final-dis-press": "#3b82f6",
    "final-dis-temp": "#ea580c",
    "comp-oil-press": "#075985",
    "comp-oil-temp": "#b45309",
    "scrub-level": "#166534",
    "recycle-valve-pos": "#16a34a",
    "fuel-press": "#0284c7",
    "unit-run-state": "#475569",
    "eng-rpm": "#6d28d9",
    "eng-load": "#059669",
    "eng-oil-press": "#60a5fa",
    "eng-jw-temp": "#d97706",
    "eng-batt-volt": "#0d9488",
    "eng-hours": "#8b4513",
    "cooler-fan-rpm": "#a855f7",
    "vib-engine": "#be185d",
    "vib-comp": "#ec4899",
  };

  const configuredTags = [
    ["suct-press", "Suction Pressure", "cooler-vfd", "VFD", "MODBUS TCP", "1 Minute", "float", "PSI", 0, 300, 58, 51.50206728833905, "raw", "EMIT DCT 'Suction Pressure' - holding register 42030"],
    ["suct-temp", "Suction Temp", "dct-panel", "PLC", "MODBUS TCP", "300 Hz", "float", "F", -20, 150, 74, -18.21641502231628, "feature_window", "EMIT DCT 'Suction Temperature' - holding register 42044"],
    ["stg1-dis-press", "Stage 1 Discharge Press", "dct-panel", "PLC", "MODBUS TCP", "1 Hz", "float", "PSI", 0, 600, 245, 283.1641085885706, "feature_window", "EMIT DCT 'Discharge 1 Pressure' - holding register 42038"],
    ["final-dis-press", "Final Discharge Press", "dct-panel", "PLC", "MODBUS TCP", "1 Hz", "float", "PSI", 0, 1500, 1040, 825.6456058025515, "feature_window", "EMIT DCT 'Final Discharge Pressure' - holding register 42031"],
    ["final-dis-temp", "Final Discharge Temp", "dct-panel", "PLC", "MODBUS TCP", "1 Hz", "float", "F", 0, 350, 262, 248.79218924906667, "feature_window", "EMIT DCT discharge temp block, final stage"],
    ["comp-oil-press", "Compressor Oil Press", "dct-panel", "PLC", "MODBUS TCP", "1 Hz", "float", "PSI", 0, 100, 55, 44.82564184114612, "feature_window", "EMIT DCT 'Compressor Oil Pressure' - holding register 42032"],
    ["comp-oil-temp", "Compressor Oil Temp", "dct-panel", "PLC", "MODBUS TCP", "1 Hz", "float", "F", 0, 250, 168, 74.50672439424481, "feature_window", "EMIT DCT 'Compressor Oil Temp' - holding register 42037"],
    ["scrub-level", "Scrubber Level", "dct-panel", "PLC", "MODBUS TCP", "1 Hz", "float", "%", 0, 100, 18, 21.818387873560305, "feature_window", "Suction scrubber liquid level - DCT Brain analog input"],
    ["recycle-valve-pos", "Recycle Valve Position", "dct-panel", "PLC", "MODBUS TCP", "20 Hz", "float", "%", 0, 100, 12, 56.03207611580873, "raw", "Recycle control valve position - DCT Brain analog input"],
    ["fuel-press", "Fuel Gas Pressure", "dct-panel", "PLC", "MODBUS TCP", "20 Hz", "float", "PSI", 0, 150, 42, 43.25722115153374, "raw", "EMIT DCT 'Fuel Pressure' - holding register 42046"],
    ["unit-run-state", "Unit Run Status", "dct-panel", "PLC", "MODBUS TCP", "1 Hz", "integer", "state", 0, 5, 2, 2, "feature_window", "EMIT Brain Run Status, compressed enum"],
    ["eng-rpm", "Engine Speed", "adem-gateway", "PLC", "OPC UA", "1 Hz", "integer", "RPM", 0, 1400, 1180, 1143, "feature_window", "CAT ADEM 'Engine Speed' via ECU gateway"],
    ["eng-load", "Engine Load", "adem-gateway", "PLC", "OPC UA", "1 Hz", "float", "%", 0, 110, 82, 56.33603341574781, "feature_window", "CAT ADEM 'Engine Pct Load' via ECU gateway"],
    ["eng-oil-press", "Engine Oil Pressure", "adem-gateway", "PLC", "OPC UA", "1 Hz", "float", "PSI", 0, 100, 64, 62.54817881880033, "feature_window", "CAT ADEM 'Engine Oil Pressure' via ECU gateway"],
    ["eng-jw-temp", "Jacket Water Temp", "adem-gateway", "PLC", "OPC UA", "1 Hz", "float", "F", 0, 230, 178, 212.32450679267632, "feature_window", "CAT ADEM 'Jacket Water Temp' via ECU gateway"],
    ["eng-batt-volt", "Battery Voltage", "ple-telematics", "Historian", "MQTT", "1 Hz", "float", "V", 0, 30, 26.1, 24.59566179086181, "feature_window", "Battery Voltage via Product Link Elite"],
    ["eng-hours", "Engine Hours", "ple-telematics", "Historian", "MQTT", "1 Minute", "integer", "Min", 0, 600000, 154320, 154336, "feature_window", "Engine Hours Low/High counter via Product Link Elite"],
    ["cooler-fan-rpm", "Cooler Fan Speed", "cooler-vfd", "VFD", "PROFINET", "1 Hz", "integer", "RPM", 0, 900, 610, 158, "feature_window", "Aerial cooler fan speed from the fan VFD"],
    ["vib-engine", "Engine Vibration", "vib-network", "Sensor", "MODBUS TCP", "1 Minute", "float", "IPS", 0, 2, 0.22, 0.860079185601187, "raw", "Engine Vibration 1 Composite Level - register 43200"],
    ["vib-comp", "Compressor Vibration", "vib-network", "Sensor", "MODBUS TCP", "1 Minute", "float", "IPS", 0, 2, 0.31, 0.38070646186694845, "raw", "Compressor Vibration 1 Composite Level - register 43203"],
  ];

  const measurementTypeForTag = (name, unit) => {
    if (/Pressure/i.test(name)) return "Pressure";
    if (/Temp/i.test(name)) return "Temperature";
    if (/Level/i.test(name)) return "Level";
    if (/Valve/i.test(name)) return "Position";
    if (/Run Status/i.test(name)) return "State";
    if (/Speed|RPM/i.test(name) || unit === "RPM") return "Speed";
    if (/Load/i.test(name)) return "Load";
    if (/Voltage/i.test(name)) return "Voltage";
    if (/Hours/i.test(name)) return "Counter";
    if (/Vibration/i.test(name)) return "Vibration";
    return "Process Value";
  };

  const decimalsForTag = (tag) => {
    if (tag.dataType === "integer" || tag.unit === "RPM" || tag.unit === "Min" || tag.unit === "state") return 0;
    if (tag.unit === "IPS" || tag.unit === "V") return 2;
    return 1;
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const tagCatalog = configuredTags.map((row) => {
    const [tagId, tagName, sourceId, sourceType, protocol, samplingRate, dataType, unit, minValue, maxValue, initialValue, latestValue, storageMode, description] = row;
    const measurementType = measurementTypeForTag(tagName, unit);
    return {
      tagId,
      tagName,
      kind: "Tag",
      assetName: assetBySourceId[sourceId] || "Cadre Compressor Skid",
      dataSource: sourceNameById[sourceId] || sourceId,
      sourceId,
      sourceType,
      protocol,
      measurementType,
      unit,
      samplingRate,
      dataType,
      storageMode,
      minValue,
      maxValue,
      initialValue,
      latestValue,
      description,
      samplingClass: samplingRate === "300 Hz" || samplingRate === "20 Hz" ? "High Frequency" : "Standard",
      lastSync: "17:25",
      plot: true,
      color: tagColors[tagId] || "#2d8fff",
      trend: {
        base: initialValue,
        latest: latestValue,
        min: minValue,
        max: maxValue,
        amplitude: Math.max((maxValue - minValue) * (samplingRate === "300 Hz" ? 0.18 : 0.035), Math.abs(initialValue) * 0.02, unit === "IPS" ? 0.04 : 0.2),
        noise: Math.max((maxValue - minValue) * (samplingRate === "300 Hz" ? 0.07 : 0.012), unit === "IPS" ? 0.02 : 0.05),
        decimals: decimalsForTag({ dataType, unit }),
      },
    };
  });

  const tagById = Object.fromEntries(tagCatalog.map((tag) => [tag.tagId, tag]));
  const tagName = (tagId) => tagById[tagId]?.tagName || tagId;

  const ctags = [
    { tagId: "ctag-compression-ratio", tagName: "Compression Ratio", kind: "CTag", assetName: "Cadre Compressor Skid", dataSource: "Computed", measurementType: "Ratio", unit: "ratio", samplingRate: "1 Hz", lastSync: "17:25", plot: true, sourceTagIds: "final-dis-press,suct-press", calculationType: "Algebraic", expression: "final-dis-press / suct-press" },
    { tagId: "ctag-thermal-rise", tagName: "Compressor Thermal Rise", kind: "CTag", assetName: "EMIT DCT Panel", dataSource: "Computed", measurementType: "Temperature Rise", unit: "F", samplingRate: "1 Hz", lastSync: "17:25", plot: true, sourceTagIds: "final-dis-temp,suct-temp", calculationType: "Algebraic", expression: "final-dis-temp - suct-temp" },
    { tagId: "ctag-vibration-envelope", tagName: "Vibration Envelope", kind: "CTag", assetName: "Vibration Sensor Network", dataSource: "Computed", measurementType: "Vibration", unit: "IPS", samplingRate: "1/min", lastSync: "17:25", plot: true, sourceTagIds: "vib-engine,vib-comp", calculationType: "Standard Deviation", expression: "StandardDeviation(vib-engine, vib-comp)" },
    { tagId: "ctag-engine-health-index", tagName: "Engine Health Index", kind: "CTag", assetName: "Engine ECU Gateway", dataSource: "Computed", measurementType: "Composite", unit: "%", samplingRate: "1 Hz", lastSync: "17:25", plot: true, sourceTagIds: "eng-load,eng-oil-press,eng-jw-temp", calculationType: "Standard Deviation", expression: "StandardDeviation(eng-load, eng-oil-press, eng-jw-temp)" },
  ];
  const tags = [...tagCatalog, ...ctags];

  const trendValue = (tag, minuteIndex, tagIndex) => {
    if (minuteIndex === minuteCount - 1) return Number(tag.latestValue.toFixed(tag.trend.decimals));
    if (tag.unit === "state") return 2;
    const progress = minuteIndex / Math.max(1, minuteCount - 1);
    const day = Math.sin((Math.PI * 2 * minuteIndex) / 1440 + tagIndex * 0.33);
    const process = Math.sin((Math.PI * 2 * minuteIndex) / 83 + tagIndex * 0.21);
    const eventStart = Math.floor(minuteCount * 0.955);
    const eventProgress = minuteIndex < eventStart ? 0 : (minuteIndex - eventStart) / Math.max(1, minuteCount - eventStart - 1);
    const drift = (tag.latestValue - tag.initialValue) * progress;
    const eventPull = (tag.latestValue - tag.initialValue) * 0.35 * eventProgress;
    const value = tag.initialValue + drift + eventPull + tag.trend.amplitude * day + tag.trend.noise * process;
    return Number(clamp(value, tag.minValue, tag.maxValue).toFixed(tag.trend.decimals));
  };

  const seriesByTagId = Object.fromEntries(
    tagCatalog.map((tag, tagIndex) => [tag.tagId, trendMinuteTimes.map((_, minuteIndex) => trendValue(tag, minuteIndex, tagIndex))])
  );
  const latestValue = (tagId) => seriesByTagId[tagId]?.[minuteCount - 1] ?? 0;
  const tagUnit = (tagId) => tagById[tagId]?.unit || "";
  const valueWithUnit = (tagId, decimals = decimalsForTag(tagById[tagId] || {})) => `${Number(latestValue(tagId)).toFixed(decimals)} ${tagUnit(tagId)}`.trim();
  const trendSlice = (tagId, points = 7, stepMinutes = 10) => {
    const values = seriesByTagId[tagId] || [];
    return Array.from({ length: points }, (_, index) => values[values.length - 1 - (points - 1 - index) * stepMinutes] ?? null);
  };
  const timeSlice = (points = 7, stepMinutes = 10) =>
    Array.from({ length: points }, (_, index) => {
      const valueIndex = trendMinuteTimes.length - 1 - (points - 1 - index) * stepMinutes;
      return trendMinuteTimes[Math.max(0, valueIndex)];
    });
  const constantLine = (value, points = 7) => Array.from({ length: points }, () => value);

  const trendTimes = timeSlice(7, 10);
  const deviationTrendTimes = timeSlice(7, 5);

  const activeAlarms = [
    { alarmEventId: "ALM-CAD-2401", assetName: "EMIT DCT Panel", location: "Compressor Skid", alarmName: "Final Discharge Temperature High", severity: "red", tripTime: "17:06", duration: "19 min", assignment: "Compressor Operations", acknowledgement: "Pending", tracking: "Open" },
    { alarmEventId: "ALM-CAD-2402", assetName: "Engine ECU Gateway", location: "Compressor Skid", alarmName: "Engine Vibration Near Danger", severity: "red", tripTime: "17:11", duration: "14 min", assignment: "Cadre Reliability", acknowledgement: "Pending", tracking: "Open" },
    { alarmEventId: "ALM-CAD-2403", assetName: "EMIT DCT Panel", location: "Compressor Skid", alarmName: "Suction Temperature Low", severity: "yellow", tripTime: "17:16", duration: "9 min", assignment: "Unassigned", acknowledgement: "Blocked", tracking: "Not Started" },
    { alarmEventId: "ALM-CAD-2404", assetName: "EMIT DCT Panel", location: "Compressor Skid", alarmName: "Final Discharge Pressure Below Load Curve", severity: "yellow", tripTime: "17:18", duration: "7 min", assignment: "Compressor Operations", acknowledgement: "Blocked", tracking: "Not Started" },
    { alarmEventId: "ALM-CAD-2405", assetName: "Engine ECU Gateway", location: "Compressor Skid", alarmName: "Jacket Water Temperature High", severity: "yellow", tripTime: "17:21", duration: "4 min", assignment: "Engine Reliability", acknowledgement: "Blocked", tracking: "Not Started" },
  ];

  const alarmDetails = [
    { tagName: "Final Discharge Temp", tagType: "Tag", condition: "Greater Than", value: 240, unit: "F", time: "17:06", duration: "19 min", currentValue: latestValue("final-dis-temp"), lastSync: "17:25" },
    { tagName: "Engine Vibration", tagType: "Tag", condition: "Greater Than", value: 0.8, unit: "IPS", time: "17:11", duration: "14 min", currentValue: latestValue("vib-engine"), lastSync: "17:25" },
    { tagName: "Suction Temp", tagType: "Tag", condition: "Less Than", value: 35, unit: "F", time: "17:16", duration: "9 min", currentValue: latestValue("suct-temp"), lastSync: "17:25" },
    { tagName: "Final Discharge Press", tagType: "Tag", condition: "Less Than", value: 900, unit: "PSI", time: "17:18", duration: "7 min", currentValue: latestValue("final-dis-press"), lastSync: "17:25" },
    { tagName: "Jacket Water Temp", tagType: "Tag", condition: "Greater Than", value: 205, unit: "F", time: "17:21", duration: "4 min", currentValue: latestValue("eng-jw-temp"), lastSync: "17:25" },
  ];

  const alarmHistory = [
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

  const baselineDeviations = [
    { deviationId: "DEV-CAD-3101", tagName: "Final Discharge Temp", measurementType: "Temperature", machine: "EMIT DCT Panel", asset: "EMIT DCT Panel", location: "Compressor Skid", direction: "Exceeds", baseline: "225.00 F", baselineLow: "180.00 F", baselineHigh: "240.00 F", baselineStdDev: "8.92 F", currentValue: valueWithUnit("final-dis-temp", 1), status: "yellow" },
    { deviationId: "DEV-CAD-3102", tagName: "Final Discharge Press", measurementType: "Pressure", machine: "EMIT DCT Panel", asset: "EMIT DCT Panel", location: "Compressor Skid", direction: "Below", baseline: "1040.00 PSI", baselineLow: "900.00 PSI", baselineHigh: "1180.00 PSI", baselineStdDev: "54.00 PSI", currentValue: valueWithUnit("final-dis-press", 1), status: "yellow" },
    { deviationId: "DEV-CAD-3103", tagName: "Compressor Oil Press", measurementType: "Pressure", machine: "EMIT DCT Panel", asset: "EMIT DCT Panel", location: "Compressor Skid", direction: "Below", baseline: "55.00 PSI", baselineLow: "50.00 PSI", baselineHigh: "72.00 PSI", baselineStdDev: "2.50 PSI", currentValue: valueWithUnit("comp-oil-press", 1), status: "yellow" },
    { deviationId: "DEV-CAD-3104", tagName: "Engine Load", measurementType: "Load", machine: "Engine ECU Gateway", asset: "Engine ECU Gateway", location: "Compressor Skid", direction: "Below", baseline: "82.00 %", baselineLow: "72.00 %", baselineHigh: "96.00 %", baselineStdDev: "4.10 %", currentValue: valueWithUnit("eng-load", 1), status: "yellow" },
    { deviationId: "DEV-CAD-3105", tagName: "Engine Vibration", measurementType: "Vibration", machine: "Vibration Sensors", asset: "Vibration Sensor Network", location: "Compressor Skid", direction: "Exceeds", baseline: "0.22 IPS", baselineLow: "0.00 IPS", baselineHigh: "0.80 IPS", baselineStdDev: "0.08 IPS", currentValue: valueWithUnit("vib-engine", 2), status: "yellow" },
    { deviationId: "DEV-CAD-3106", tagName: "Cooler Fan Speed", measurementType: "Speed", machine: "Cooler Fan VFD", asset: "Cooler Fan VFD", location: "Compressor Skid", direction: "Below", baseline: "610 RPM", baselineLow: "520 RPM", baselineHigh: "760 RPM", baselineStdDev: "42 RPM", currentValue: valueWithUnit("cooler-fan-rpm", 0), status: "yellow" },
    { deviationId: "DEV-CAD-3107", tagName: "Recycle Valve Position", measurementType: "Position", machine: "EMIT DCT Panel", asset: "EMIT DCT Panel", location: "Compressor Skid", direction: "Exceeds", baseline: "12.00 %", baselineLow: "0.00 %", baselineHigh: "52.00 %", baselineStdDev: "8.50 %", currentValue: valueWithUnit("recycle-valve-pos", 1), status: "yellow" },
  ];

  const baselineRules = [
    { baselineId: "BASE-CAD-A-001", scope: "Asset", assetName: "Cadre Compressor Skid", tagId: "", tagName: "Compressor Package Health", measurementType: "Composite", unit: "%", baselineLow: "82.00", baselineTarget: "94.00", baselineStdDev: "5.20", baselineHigh: "100.00", evaluationWindow: "15m", warningDelay: "2 min", enabled: "Yes", owner: "Cadre Reliability" },
    { baselineId: "BASE-CAD-T-001", scope: "Tag", assetName: "EMIT DCT Panel", tagId: "final-dis-temp", tagName: tagName("final-dis-temp"), measurementType: "Temperature", unit: "F", baselineLow: "180.00", baselineTarget: "225.00", baselineStdDev: "8.92", baselineHigh: "240.00", evaluationWindow: "15m", warningDelay: "2 min", enabled: "Yes", owner: "Compressor Operations" },
    { baselineId: "BASE-CAD-T-002", scope: "Tag", assetName: "EMIT DCT Panel", tagId: "final-dis-press", tagName: tagName("final-dis-press"), measurementType: "Pressure", unit: "PSI", baselineLow: "900.00", baselineTarget: "1040.00", baselineStdDev: "54.00", baselineHigh: "1180.00", evaluationWindow: "15m", warningDelay: "2 min", enabled: "Yes", owner: "Compressor Operations" },
    { baselineId: "BASE-CAD-T-003", scope: "Tag", assetName: "EMIT DCT Panel", tagId: "comp-oil-press", tagName: tagName("comp-oil-press"), measurementType: "Pressure", unit: "PSI", baselineLow: "50.00", baselineTarget: "55.00", baselineStdDev: "2.50", baselineHigh: "72.00", evaluationWindow: "5m", warningDelay: "1 min", enabled: "Yes", owner: "Compressor Operations" },
    { baselineId: "BASE-CAD-T-004", scope: "Tag", assetName: "Engine ECU Gateway", tagId: "eng-load", tagName: tagName("eng-load"), measurementType: "Load", unit: "%", baselineLow: "72.00", baselineTarget: "82.00", baselineStdDev: "4.10", baselineHigh: "96.00", evaluationWindow: "15m", warningDelay: "2 min", enabled: "Yes", owner: "Engine Reliability" },
    { baselineId: "BASE-CAD-T-005", scope: "Tag", assetName: "Vibration Sensor Network", tagId: "vib-engine", tagName: tagName("vib-engine"), measurementType: "Vibration", unit: "IPS", baselineLow: "0.00", baselineTarget: "0.22", baselineStdDev: "0.08", baselineHigh: "0.80", evaluationWindow: "5m", warningDelay: "1 min", enabled: "Yes", owner: "Cadre Reliability" },
    { baselineId: "BASE-CAD-T-006", scope: "Tag", assetName: "Cooler Fan VFD", tagId: "cooler-fan-rpm", tagName: tagName("cooler-fan-rpm"), measurementType: "Speed", unit: "RPM", baselineLow: "520", baselineTarget: "610", baselineStdDev: "42", baselineHigh: "760", evaluationWindow: "15m", warningDelay: "2 min", enabled: "Yes", owner: "Compressor Operations" },
    { baselineId: "BASE-CAD-C-001", scope: "CTag", assetName: "Cadre Compressor Skid", tagId: "ctag-compression-ratio", tagName: "Compression Ratio", measurementType: "Ratio", unit: "ratio", baselineLow: "12.00", baselineTarget: "18.00", baselineStdDev: "2.10", baselineHigh: "24.00", evaluationWindow: "15m", warningDelay: "2 min", enabled: "Yes", owner: "Cadre Reliability" },
  ];

  const groups = [
    { groupId: "GRP-001", groupName: "Compressor Operations", purpose: "First response for Cadre compressor process alarms", members: "Maya Singh, Owen Carter", delivery: "Email, SMS", active: "Yes" },
    { groupId: "GRP-002", groupName: "Cadre Reliability", purpose: "Rotating equipment, vibration, and compressor health review", members: "Alex Rivera, Sam Patel", delivery: "Email, SMS", active: "Yes" },
    { groupId: "GRP-003", groupName: "Engine Reliability", purpose: "CAT ADEM engine condition and load review", members: "Jordan Ellis, Sam Patel", delivery: "Email", active: "Yes" },
    { groupId: "GRP-004", groupName: "Automation Support", purpose: "InfluxDB, MQTT, OPC UA, Modbus, and PROFINET support", members: "Cody, Admin", delivery: "Email", active: "Yes" },
  ];

  const users = [
    { userId: "USR-001", userName: "Cody", email: "cody@example.com", role: "System Administrator", status: "Active", notifications: "Email, SMS" },
    { userId: "USR-002", userName: "Maya Singh", email: "maya.singh@cadre-demo.local", role: "Operator", status: "Active", notifications: "SMS" },
    { userId: "USR-003", userName: "Alex Rivera", email: "alex.rivera@cadre-demo.local", role: "Maintenance / Reliability", status: "Active", notifications: "Email, SMS" },
    { userId: "USR-004", userName: "Owen Carter", email: "owen.carter@cadre-demo.local", role: "Operator", status: "Active", notifications: "Email" },
    { userId: "USR-005", userName: "Jordan Ellis", email: "jordan.ellis@cadre-demo.local", role: "Configurator", status: "Active", notifications: "Email" },
  ];

  const messages = [
    { messageId: "MSG-001", title: "Cadre simulator raw stop limit reached", target: "Automation Support", createdAt: "2026-06-17 17:25", status: "Unread" },
    { messageId: "MSG-002", title: "Engine vibration warning requires reliability review", target: "Cadre Reliability", createdAt: "2026-06-17 17:16", status: "Unread" },
    { messageId: "MSG-003", title: "InfluxDB write path connected", target: "Cody", createdAt: "2026-06-17 17:10", status: "Acknowledged" },
  ];

  const notificationRules = [
    { ruleId: "NR-001", name: "Critical Compressor Trips", trigger: "Alarm Active", targetGroup: "Compressor Operations", delivery: "SMS, Email", enabled: "Yes" },
    { ruleId: "NR-002", name: "Vibration Warning Review", trigger: "Maintenance Warning", targetGroup: "Cadre Reliability", delivery: "Email", enabled: "Yes" },
    { ruleId: "NR-003", name: "Engine Condition Escalation", trigger: "Alarm Active", targetGroup: "Engine Reliability", delivery: "Email", enabled: "Yes" },
  ];

  const auditLog = [
    { auditId: "AUD-CAD-2101", occurredAt: "2026-06-17 15:15", user: "Cody", action: "Import", entity: "Tag_Config", entityId: "asset-simulator", summary: "Imported Cadre compressor simulator configuration with 20 tags" },
    { auditId: "AUD-CAD-2102", occurredAt: "2026-06-17 17:10", user: "System", action: "Create", entity: "Simulator_Run", entityId: run.runId, summary: "Simulator run started for Cadre compressor skid" },
    { auditId: "AUD-CAD-2103", occurredAt: "2026-06-17 17:25", user: "System", action: "Stop", entity: "Simulator_Run", entityId: run.runId, summary: "Simulator stopped at raw storage stop limit" },
  ];

  const diagnostics = [
    { component: "InfluxDB", status: "green", lastCheck: "17:25", message: `${run.writtenPoints.toLocaleString()} Cadre points written to asset_tag_values`, action: "None" },
    { component: "Postgres", status: "green", lastCheck: "17:25", message: "Cadre configuration state store reachable", action: "None" },
    { component: "Modbus TCP", status: "green", lastCheck: "17:25", message: "DCT panel and vibration registers available", action: "None" },
    { component: "OPC UA", status: "yellow", lastCheck: "17:25", message: "Gateway publish path stopped with simulator", action: "Confirm runtime state before live demo" },
    { component: "MQTT", status: "green", lastCheck: "17:25", message: "Product Link telematics publisher completed run", action: "None" },
    { component: "PROFINET", status: "yellow", lastCheck: "17:25", message: "PROFINET RT/UDP provider stopped with simulator", action: "Confirm gateway state before live demo" },
  ];

  const screenMatrix = [
    ["Login", "Authenticate", "Site Status"],
    ["Site Status", "Active Alarms", "Active Alarms"],
    ["Site Status", "Asset Alarm Detail", "Asset Alarm Detail"],
    ["Site Status", "Maintenance Warnings", "Maintenance Warnings"],
    ["Active Alarms", "Alarm Detail", "Asset Alarm Detail"],
    ["Active Alarms", "Acknowledge", "Assignment Modal"],
    ["Assignment Modal", "Assign User", "Alarm Acknowledged"],
    ["Asset Alarm Detail", "Plot Data Trends", "Alarm Data Trends"],
    ["Alarm Data Trends", "Back", "Asset Alarm Detail"],
    ["Alarm History", "See Alarm Detail", "Alarm History Detail"],
    ["Maintenance Warnings", "Plot Trend", "Maintenance Warning Trend"],
    ["Maintenance Warnings", "Notify", "Notification Action"],
    ["Asset Inventory", "Add Asset", "New Asset"],
    ["Asset Inventory", "Asset Configuration", "Asset Configuration"],
    ["Asset Inventory", "Alarms", "Alarm List"],
    ["Alarm List", "Add Alarm", "Alarm Configuration"],
    ["Alarm List", "Edit Alarm", "Alarm Configuration"],
    ["Group List", "Add Group", "Group Configuration"],
    ["Group List", "Edit Group", "Group Configuration"],
    ["License Management", "Renew License", "Renewal Workflow"],
    ["User Admin", "Add User", "Edit User"],
    ["User Admin", "Edit User", "Edit User"],
    ["Message Center", "Acknowledge Message", "Message Center"],
  ];

  const alarmTrendSeries = [
    { name: tagName("final-dis-temp"), unit: "F", data: trendSlice("final-dis-temp"), color: tagColors["final-dis-temp"] },
    { name: tagName("final-dis-press"), unit: "PSI", data: trendSlice("final-dis-press"), color: tagColors["final-dis-press"] },
    { name: tagName("eng-rpm"), unit: "RPM", data: trendSlice("eng-rpm"), color: tagColors["eng-rpm"] },
    { name: tagName("vib-engine"), unit: "IPS", data: trendSlice("vib-engine"), color: tagColors["vib-engine"] },
  ];

  const deviationTrendSeries = [
    { name: "Measured Tag Data", unit: "F", data: trendSlice("final-dis-temp", 7, 5), color: tagColors["final-dis-temp"], showSymbol: true },
    { name: "Baseline Low", unit: "F", data: constantLine(180), color: "#0f766e", baselineLine: true, lineType: "dashed" },
    { name: "Baseline Target", unit: "F", data: constantLine(225), color: "#1d4ed8", baselineLine: true },
    { name: "Std Dev -1 SD", unit: "F", data: constantLine(216.08), color: "#64748b", baselineLine: true, lineType: "dotted", width: 1.5 },
    { name: "Std Dev +1 SD", unit: "F", data: constantLine(233.92), color: "#64748b", baselineLine: true, lineType: "dotted", width: 1.5 },
    { name: "Baseline High", unit: "F", data: constantLine(240), color: "#c2410c", baselineLine: true, lineType: "dashed" },
  ];

  const siteHealthTrendByDuration = {
    "24h": {
      label: "24-Hour Cadre Health Trend",
      times: timeSlice(7, 240),
      series: [
        { name: "Active Alarms", data: [1, 1, 2, 2, 3, 4, activeAlarms.length], color: "#c83d3d" },
        { name: "Maintenance Warnings", data: [2, 2, 3, 4, 5, 6, baselineDeviations.length], color: "#c89a19" },
      ],
    },
    "7d": {
      label: "7-Day Cadre Health Trend",
      times: timeSlice(7, 1440),
      series: [
        { name: "Active Alarms", data: [0, 1, 1, 2, 3, 4, activeAlarms.length], color: "#c83d3d" },
        { name: "Maintenance Warnings", data: [1, 2, 3, 4, 5, 6, baselineDeviations.length], color: "#c89a19" },
      ],
    },
    "14d": {
      label: "14-Day Cadre Health Trend",
      times: timeSlice(13, 720),
      series: [
        { name: "Active Alarms", data: [0, 0, 1, 1, 1, 2, 2, 3, 3, 4, 4, 5, activeAlarms.length], color: "#c83d3d" },
        { name: "Maintenance Warnings", data: [1, 1, 2, 2, 3, 3, 4, 4, 5, 6, 6, 7, baselineDeviations.length], color: "#c89a19" },
      ],
    },
    "30d": {
      label: "30-Day Cadre Health Trend",
      times: timeSlice(8, 1440),
      series: [
        { name: "Active Alarms", data: [0, 1, 1, 2, 2, 3, 4, activeAlarms.length], color: "#c83d3d" },
        { name: "Maintenance Warnings", data: [1, 2, 3, 3, 4, 5, 6, baselineDeviations.length], color: "#c89a19" },
      ],
    },
  };

  const postgres = {
    engine: "Postgres SQL",
    schema: "rpulse_mock_cadre",
    tables: {
      asset: assets,
      machine: machines,
      data_source: dataSources,
      tag: tagCatalog,
      ctag: ctags,
      alarm_event: activeAlarms,
      alarm_history: alarmHistory,
      baseline_deviation: baselineDeviations,
      baseline_rule: baselineRules,
      notification_group: groups,
      app_user: users,
      system_message: messages,
      notification_rule: notificationRules,
      audit_log: auditLog,
      diagnostic: diagnostics,
    },
  };

  const influx = {
    engine: "InfluxDB",
    bucket: "asset_simulator",
    measurement: "asset_tag_values",
    site: "Cadre Compressor Skid",
    precision: "mixed: 300 Hz, 20 Hz, 1 Hz, 1 Minute",
    retention: "7d demo window",
    range: { start: trendMinuteTimes[0], stop: trendMinuteTimes[trendMinuteTimes.length - 1] },
    timestamps: trendMinuteTimes,
    tags: tagCatalog.map(({ tagId, tagName, dataSource, measurementType, unit, samplingRate, protocol, storageMode }) => ({ tagId, tagName, dataSource, measurementType, unit, samplingRate, protocol, storageMode })),
    seriesByTagId,
    sampleQuery: 'from(bucket: "asset_simulator") |> range(start: -15m) |> filter(fn: (r) => r._measurement == "asset_tag_values")',
    run,
  };

  return {
    shell,
    navSections,
    assets,
    activeAlarms,
    alarmDetails,
    alarmHistory,
    baselineDeviations,
    baselineRules,
    machines,
    dataSources,
    tags,
    tagCatalog,
    tagColors,
    groups,
    users,
    messages,
    notificationRules,
    auditLog,
    diagnostics,
    screenMatrix,
    trendTimes,
    deviationTrendTimes,
    alarmTrendSeries,
    deviationTrendSeries,
    siteHealthTrendByDuration,
    trendMinuteTimes,
    postgres,
    influx,
  };
})();