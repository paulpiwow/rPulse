
export const assets = [
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

export const machines = [
  { machineId: "MCH-001", assetName: "Cadre Compressor Skid", machineName: "Compressor Package", location: "Compressor Skid", type: "Package", description: "Overall compressor skid and simulator run context." },
  { machineId: "MCH-002", assetName: "EMIT DCT Panel", machineName: "EMIT DCT Panel", location: "Compressor Skid", type: "PLC", description: "EMIT DCT Modbus TCP source for process pressures, temperatures, and state." },
  { machineId: "MCH-003", assetName: "Engine ECU Gateway", machineName: "Engine ECU Gateway", location: "Compressor Skid", type: "PLC", description: "CAT ADEM ECU gateway exposing engine speed, load, oil pressure, and jacket water temperature." },
  { machineId: "MCH-004", assetName: "Product Link Telematics", machineName: "Product Link Telematics", location: "Compressor Skid", type: "Historian", description: "MQTT telematics feed for battery voltage and engine-hour counters." },
  { machineId: "MCH-005", assetName: "Cooler Fan VFD", machineName: "Cooler Fan VFD", location: "Compressor Skid", type: "VFD", description: "Aerial cooler fan drive and suction pressure source." },
  { machineId: "MCH-006", assetName: "Vibration Sensor Network", machineName: "Vibration Sensors", location: "Compressor Skid", type: "Sensor", description: "Engine and compressor vibration sensor network." },
];

export const dataSources = [
  { dataSourceId: "DS-001", machineName: "EMIT DCT Panel", sourceName: "EMIT DCT Panel", sourceType: "PLC", protocol: "MODBUS TCP", location: "Compressor Skid", networkAddress: "tcp://0.0.0.0:1502", status: "green" },
  { dataSourceId: "DS-002", machineName: "Engine ECU Gateway", sourceName: "Engine ECU Gateway", sourceType: "PLC", protocol: "OPC UA", location: "Compressor Skid", networkAddress: "opc.tcp://0.0.0.0:4840", status: "yellow" },
  { dataSourceId: "DS-003", machineName: "Product Link Telematics", sourceName: "Product Link Telematics", sourceType: "Historian", protocol: "MQTT", location: "Compressor Skid", networkAddress: "mqtt://mosquitto:1883", status: "green" },
  { dataSourceId: "DS-004", machineName: "Cooler Fan VFD", sourceName: "Cooler Fan VFD", sourceType: "VFD", protocol: "PROFINET", location: "Compressor Skid", networkAddress: "udp://pn-gateway:34962", status: "yellow" },
  { dataSourceId: "DS-005", machineName: "Vibration Sensors", sourceName: "Vibration Sensors", sourceType: "Sensor", protocol: "MODBUS TCP", location: "Compressor Skid", networkAddress: "tcp://0.0.0.0:1502", status: "green" },
];

export const sourceNameById = {
  "dct-panel": "EMIT DCT Panel",
  "adem-gateway": "Engine ECU Gateway",
  "ple-telematics": "Product Link Telematics",
  "cooler-vfd": "Cooler Fan VFD",
  "vib-network": "Vibration Sensors",
};

export const machineBySourceId = {
  "dct-panel": "EMIT DCT Panel",
  "adem-gateway": "Engine ECU Gateway",
  "ple-telematics": "Product Link Telematics",
  "cooler-vfd": "Cooler Fan VFD",
  "vib-network": "Vibration Sensors",
};

export const assetBySourceId = {
  "dct-panel": "EMIT DCT Panel",
  "adem-gateway": "Engine ECU Gateway",
  "ple-telematics": "Product Link Telematics",
  "cooler-vfd": "Cooler Fan VFD",
  "vib-network": "Vibration Sensor Network",
};
