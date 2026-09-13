/* Device Service Layer */

const COLLECTION_NAME = 'energyDevices';

export const DEVICE_TYPES = {
  SMART_METER: 'Smart Meter',
  SOLAR_INVERTER: 'Solar Inverter',
  BATTERY_STORAGE: 'Battery Storage',
  WIND_TURBINE: 'Wind Turbine',
  EV_CHARGER: 'EV Charger',
  WEATHER_STATION: 'Weather Station',
};

export const DEVICE_STATUSES = {
  SIMULATION: 'Simulation Mode',
  CONNECTED: 'Connected',
  DISCONNECTED: 'Disconnected',
  MAINTENANCE: 'Maintenance',
};

export const CONNECTION_MODES = {
  MANUAL_SIMULATION: 'Manual Simulation',
  API_READY: 'API Ready',
  IOT_READY: 'IoT Ready',
};

/* Pluggable Driver Layer Interface for Future API/IoT Extensions */
export class DeviceDriverInterface {
  async connect() {
    throw new Error('connect() driver method not implemented');
  }
  async fetchTelemetry() {
    throw new Error('fetchTelemetry() driver method not implemented');
  }
}

export class SimulatedDriver extends DeviceDriverInterface {
  async connect() {
    return { status: 'Connected', mode: CONNECTION_MODES.MANUAL_SIMULATION, latencyMs: 12 };
  }
  async fetchTelemetry(device) {
    const isMeter = device.deviceType === DEVICE_TYPES.SMART_METER;
    const isSolar = device.deviceType === DEVICE_TYPES.SOLAR_INVERTER;
    if (isMeter) {
      return {
        energyConsumed: parseFloat((Math.random() * 1.5 + 0.5).toFixed(2)),
        energyExported: parseFloat((Math.random() * 0.8).toFixed(2)),
        voltage: Math.round(228 + Math.random() * 8),
        current: parseFloat((5 + Math.random() * 10).toFixed(1)),
        powerFactor: parseFloat((0.92 + Math.random() * 0.07).toFixed(2)),
        frequency: 50.0,
      };
    } else if (isSolar) {
      return {
        generatedEnergy: parseFloat((Math.random() * 3.5 + 1.2).toFixed(2)),
        currentOutput: parseFloat((Math.random() * 4.0 + 1.0).toFixed(2)),
        peakOutput: 5.0,
        efficiency: parseFloat((96.5 + Math.random() * 2).toFixed(1)),
        temperature: Math.round(38 + Math.random() * 10),
      };
    }
    return { status: 'OK', simulatedValue: Math.random() * 100 };
  }
}

export class RestApiDriver extends DeviceDriverInterface {
  async connect() {
    return { status: 'API Connected', mode: CONNECTION_MODES.API_READY, endpoint: 'https://api.smartmeter.io/v1' };
  }
  async fetchTelemetry() {
    // Placeholder for future REST API response parsing
    return null;
  }
}

export class MqttDriver extends DeviceDriverInterface {
  async connect() {
    return { status: 'MQTT Subscribed', mode: CONNECTION_MODES.IOT_READY, broker: 'mqtt://broker.yuga-energy.org:1883' };
  }
  async fetchTelemetry() {
    // Placeholder for future MQTT payload handler
    return null;
  }
}

export function getDeviceDriver(mode) {
  switch (mode) {
    case CONNECTION_MODES.API_READY:
      return new RestApiDriver();
    case CONNECTION_MODES.IOT_READY:
      return new MqttDriver();
    default:
      return new SimulatedDriver();
  }
}

export const INITIAL_DEVICES = [];

const LOCAL_DEVICES_KEY = 'hifai_registered_devices';

function getLocalDevices(userId = 'guest') {
  try {
    const key = userId === 'guest' ? LOCAL_DEVICES_KEY : `${LOCAL_DEVICES_KEY}_${userId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }

    // Fallback: Check general key and other session keys so user work is never lost
    const fallbackKeys = [
      LOCAL_DEVICES_KEY,
      `${LOCAL_DEVICES_KEY}_guest`,
      `${LOCAL_DEVICES_KEY}_google_demo_user`,
      `${LOCAL_DEVICES_KEY}_demo-user-001`,
    ];

    for (const fbKey of fallbackKeys) {
      const fbRaw = localStorage.getItem(fbKey);
      if (fbRaw) {
        const parsed = JSON.parse(fbRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Auto-migrate to current userId
          saveLocalDevices(userId, parsed);
          return parsed;
        }
      }
    }

    // Check any localStorage key matching hifai_registered_devices
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && storageKey.startsWith(LOCAL_DEVICES_KEY)) {
        const val = localStorage.getItem(storageKey);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed) && parsed.length > 0) {
              saveLocalDevices(userId, parsed);
              return parsed;
            }
          } catch {}
        }
      }
    }

    return INITIAL_DEVICES.map((d) => ({ ...d, userId }));
  } catch {
    return INITIAL_DEVICES.map((d) => ({ ...d, userId }));
  }
}

function saveLocalDevices(userId = 'guest', devices) {
  try {
    const key = userId === 'guest' ? LOCAL_DEVICES_KEY : `${LOCAL_DEVICES_KEY}_${userId}`;
    localStorage.setItem(key, JSON.stringify(devices));
    localStorage.setItem(LOCAL_DEVICES_KEY, JSON.stringify(devices));
  } catch (e) {
    console.error('LocalStorage save devices error:', e);
  }
}

export async function fetchEnergyDevices(userId = 'guest') {
  return getLocalDevices(userId);
}

export async function getDeviceById(id, userId = 'guest') {
  const devices = getLocalDevices(userId);
  return devices.find((d) => d.id === id) || null;
}

export async function addEnergyDevice(userId = 'guest', deviceData) {
  const newDevice = {
    id: `DEV-LOCAL-${Date.now()}`,
    userId,
    status: 'Connected',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...deviceData,
  };
  const current = getLocalDevices(userId);
  const updated = [newDevice, ...current.filter((d) => d.id !== newDevice.id)];
  saveLocalDevices(userId, updated);
  return newDevice;
}

export async function updateEnergyDevice(id, deviceData, userId = 'guest') {
  const effectiveUserId = userId !== 'guest' ? userId : (deviceData?.userId || 'guest');
  const current = getLocalDevices(effectiveUserId);
  const updated = current.map((d) =>
    d.id === id ? { ...d, ...deviceData, updatedAt: new Date().toISOString() } : d
  );
  saveLocalDevices(effectiveUserId, updated);
  return { id, ...deviceData };
}

export async function deleteEnergyDevice(id, userId = 'guest') {
  const current = getLocalDevices(userId);
  const updated = current.filter((d) => d.id !== id);
  saveLocalDevices(userId, updated);
  return true;
}
