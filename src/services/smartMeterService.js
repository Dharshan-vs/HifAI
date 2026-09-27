/* Smart Meter Service */

export const INITIAL_METERS = [
  {
    id: 'SM-LOCAL-DINDIGUL-01',
    userId: 'guest',
    name: 'Household Primary Smart Meter',
    serialNumber: 'SE-98210-SM1',
    location: 'Main Road, Dindigul, Tamil Nadu',
    lat: 10.3673,
    lon: 77.9803,
    isLocationLocked: true,
    isPinned: true,
    isSimulationMode: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_SMART_READINGS = [
  {
    id: 'SMR-LOCAL-101',
    userId: 'guest',
    meterId: 'SM-LOCAL-DINDIGUL-01',
    meterName: 'Household Primary Smart Meter',
    energyConsumed: 124.5,
    energyExported: 18.2,
    voltage: 231.4,
    current: 14.2,
    powerFactor: 0.98,
    source: 'Smart Meter Telemetry (Verified)',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'SMR-LOCAL-102',
    userId: 'guest',
    meterId: 'SM-LOCAL-DINDIGUL-01',
    meterName: 'Household Primary Smart Meter',
    energyConsumed: 112.3,
    energyExported: 14.5,
    voltage: 230.8,
    current: 13.8,
    powerFactor: 0.97,
    source: 'Smart Meter Telemetry (Verified)',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'SMR-LOCAL-103',
    userId: 'guest',
    meterId: 'SM-LOCAL-DINDIGUL-01',
    meterName: 'Household Primary Smart Meter',
    energyConsumed: 105.6,
    energyExported: 16.0,
    voltage: 231.0,
    current: 13.2,
    powerFactor: 0.98,
    source: 'Smart Meter Telemetry (Verified)',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'SMR-LOCAL-104',
    userId: 'guest',
    meterId: 'SM-LOCAL-DINDIGUL-01',
    meterName: 'Household Primary Smart Meter',
    energyConsumed: 98.4,
    energyExported: 12.8,
    voltage: 229.8,
    current: 12.5,
    powerFactor: 0.96,
    source: 'Smart Meter Telemetry (Verified)',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: 'SMR-LOCAL-105',
    userId: 'guest',
    meterId: 'SM-LOCAL-DINDIGUL-01',
    meterName: 'Household Primary Smart Meter',
    energyConsumed: 101.1,
    energyExported: 15.0,
    voltage: 232.0,
    current: 14.0,
    powerFactor: 0.99,
    source: 'Smart Meter Telemetry (Verified)',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
  },
];

const LOCAL_METERS_KEY = 'hifai_registered_smart_meters';

function getLocalMeters(userId = 'guest') {
  try {
    const key = `${LOCAL_METERS_KEY}_${userId || 'guest'}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    return INITIAL_METERS;
  } catch {
    return INITIAL_METERS;
  }
}

function saveLocalMeters(userId = 'guest', meters) {
  try {
    const key = `${LOCAL_METERS_KEY}_${userId || 'guest'}`;
    localStorage.setItem(key, JSON.stringify(meters));
  } catch (e) {
    console.error('LocalStorage save error:', e);
  }
}

export async function fetchSmartMeters(userId = 'guest') {
  return getLocalMeters(userId);
}

export async function registerSmartMeter(userId = 'guest', meterData) {
  const currentLocal = getLocalMeters(userId);
  const newMeter = {
    id: `SM-LOCAL-${Date.now()}`,
    userId,
    ...meterData,
    lat: meterData.lat ? parseFloat(parseFloat(meterData.lat).toFixed(4)) : 10.3673,
    lon: meterData.lon ? parseFloat(parseFloat(meterData.lon).toFixed(4)) : 77.9803,
    isLocationLocked: true,
    isPinned: true,
    isSimulationMode: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const updatedLocal = [newMeter, ...currentLocal.filter((m) => m.id !== newMeter.id)];
  saveLocalMeters(userId, updatedLocal);

  try {
    const locObj = {
      address: newMeter.location || `${newMeter.lat}, ${newMeter.lon}`,
      lat: newMeter.lat,
      lon: newMeter.lon,
      isPinned: true,
      isLocationLocked: true,
      lockedAt: new Date().toISOString(),
    };
    localStorage.setItem(`yuga_consumer_location_${userId || 'guest'}`, JSON.stringify(locObj));
    localStorage.setItem('yuga_consumer_location', JSON.stringify(locObj));
    if (newMeter.location) {
      localStorage.setItem('hifai_user_city', newMeter.location.split(',')[0].trim());
    }
  } catch {}

  return newMeter;
}

export async function updateSmartMeter(userId = 'guest', id, meterData) {
  const currentLocal = getLocalMeters(userId);
  const updatedLocal = currentLocal.map((m) =>
    m.id === id
      ? {
          ...m,
          ...meterData,
          // Preserve permanently locked 1-time pinned coordinates
          lat: m.lat || (meterData.lat ? parseFloat(parseFloat(meterData.lat).toFixed(4)) : 10.3673),
          lon: m.lon || (meterData.lon ? parseFloat(parseFloat(meterData.lon).toFixed(4)) : 77.9803),
          location: m.location || meterData.location,
          isLocationLocked: true,
          isPinned: true,
          updatedAt: new Date().toISOString(),
        }
      : m
  );
  saveLocalMeters(userId, updatedLocal);

  try {
    const target = updatedLocal.find((m) => m.id === id);
    if (target) {
      const locObj = {
        address: target.location || `${target.lat}, ${target.lon}`,
        lat: target.lat,
        lon: target.lon,
        isPinned: true,
        isLocationLocked: true,
      };
      localStorage.setItem(`yuga_consumer_location_${userId}`, JSON.stringify(locObj));
      localStorage.setItem('yuga_consumer_location', JSON.stringify(locObj));
      if (target.location) {
        localStorage.setItem('hifai_user_city', target.location.split(',')[0].trim());
      }
    }
  } catch {}

  return { id, ...meterData };
}

export async function deleteSmartMeter(userId = 'guest', id) {
  const currentLocal = getLocalMeters(userId);
  const updatedLocal = currentLocal.filter((m) => m.id !== id);
  saveLocalMeters(userId, updatedLocal);
  return { success: true, id };
}

const LOCAL_READINGS_KEY = 'hifai_registered_smart_readings';

function getLocalReadings(userId = 'guest') {
  try {
    const key = `${LOCAL_READINGS_KEY}_${userId || 'guest'}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    return INITIAL_SMART_READINGS;
  } catch {
    return INITIAL_SMART_READINGS;
  }
}

function saveLocalReadings(userId = 'guest', readings) {
  try {
    const key = `${LOCAL_READINGS_KEY}_${userId || 'guest'}`;
    localStorage.setItem(key, JSON.stringify(readings));
  } catch (e) {
    console.error('LocalStorage save readings error:', e);
  }
}

export async function fetchSmartMeterReadings(userId = 'guest') {
  return getLocalReadings(userId);
}

export async function addSmartMeterReading(userId = 'guest', readingData) {
  const newReading = {
    id: `SMR-LOCAL-${Date.now()}`,
    userId,
    ...readingData,
    source: readingData.source || 'Manual Entry (Simulation Mode)',
    timestamp: readingData.timestamp || new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  const currentLocal = getLocalReadings(userId);
  const updatedLocal = [newReading, ...currentLocal.filter((r) => r.id !== newReading.id)];
  saveLocalReadings(userId, updatedLocal);
  return newReading;
}

export async function updateSmartMeterReading(id, readingData, userId = 'guest') {
  const targetUser = readingData.userId || userId;
  const currentLocal = getLocalReadings(targetUser);
  const updatedLocal = currentLocal.map((r) => (r.id === id ? { ...r, ...readingData } : r));
  saveLocalReadings(targetUser, updatedLocal);
  return { id, ...readingData };
}

export async function deleteSmartMeterReading(id, userId = 'guest') {
  const currentLocal = getLocalReadings(userId);
  const updatedLocal = currentLocal.filter((r) => r.id !== id);
  saveLocalReadings(userId, updatedLocal);
  return true;
}
