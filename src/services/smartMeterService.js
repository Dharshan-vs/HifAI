/* Smart Meter Service */

export const INITIAL_METERS = [];

export const INITIAL_SMART_READINGS = [];

const LOCAL_METERS_KEY = 'hifai_registered_smart_meters';

function getLocalMeters(userId = 'guest') {
  try {
    const key = userId === 'guest' ? LOCAL_METERS_KEY : `${LOCAL_METERS_KEY}_${userId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }

    const fallbackKeys = [
      LOCAL_METERS_KEY,
      `${LOCAL_METERS_KEY}_guest`,
      `${LOCAL_METERS_KEY}_google_demo_user`,
      `${LOCAL_METERS_KEY}_demo-user-001`,
    ];

    for (const fbKey of fallbackKeys) {
      const fbRaw = localStorage.getItem(fbKey);
      if (fbRaw) {
        const parsed = JSON.parse(fbRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          saveLocalMeters(userId, parsed);
          return parsed;
        }
      }
    }

    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && storageKey.startsWith(LOCAL_METERS_KEY)) {
        const val = localStorage.getItem(storageKey);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed) && parsed.length > 0) {
              saveLocalMeters(userId, parsed);
              return parsed;
            }
          } catch {}
        }
      }
    }

    return INITIAL_METERS.map((m) => ({ ...m, userId }));
  } catch {
    return INITIAL_METERS.map((m) => ({ ...m, userId }));
  }
}

function saveLocalMeters(userId = 'guest', meters) {
  try {
    const key = userId === 'guest' ? LOCAL_METERS_KEY : `${LOCAL_METERS_KEY}_${userId}`;
    localStorage.setItem(key, JSON.stringify(meters));
    localStorage.setItem(LOCAL_METERS_KEY, JSON.stringify(meters));
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
    lat: meterData.lat ? parseFloat(parseFloat(meterData.lat).toFixed(4)) : 13.0827,
    lon: meterData.lon ? parseFloat(parseFloat(meterData.lon).toFixed(4)) : 80.2707,
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
    };
    localStorage.setItem(`yuga_consumer_location_${userId}`, JSON.stringify(locObj));
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
          lat: meterData.lat ? parseFloat(parseFloat(meterData.lat).toFixed(4)) : (m.lat || 13.0827),
          lon: meterData.lon ? parseFloat(parseFloat(meterData.lon).toFixed(4)) : (m.lon || 80.2707),
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
    const key = userId === 'guest' ? LOCAL_READINGS_KEY : `${LOCAL_READINGS_KEY}_${userId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }

    const fallbackKeys = [
      LOCAL_READINGS_KEY,
      `${LOCAL_READINGS_KEY}_guest`,
      `${LOCAL_READINGS_KEY}_google_demo_user`,
      `${LOCAL_READINGS_KEY}_demo-user-001`,
    ];

    for (const fbKey of fallbackKeys) {
      const fbRaw = localStorage.getItem(fbKey);
      if (fbRaw) {
        const parsed = JSON.parse(fbRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          saveLocalReadings(userId, parsed);
          return parsed;
        }
      }
    }

    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && storageKey.startsWith(LOCAL_READINGS_KEY)) {
        const val = localStorage.getItem(storageKey);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed) && parsed.length > 0) {
              saveLocalReadings(userId, parsed);
              return parsed;
            }
          } catch {}
        }
      }
    }

    return INITIAL_SMART_READINGS.map((r) => ({ ...r, userId }));
  } catch {
    return INITIAL_SMART_READINGS.map((r) => ({ ...r, userId }));
  }
}

function saveLocalReadings(userId = 'guest', readings) {
  try {
    const key = userId === 'guest' ? LOCAL_READINGS_KEY : `${LOCAL_READINGS_KEY}_${userId}`;
    localStorage.setItem(key, JSON.stringify(readings));
    localStorage.setItem(LOCAL_READINGS_KEY, JSON.stringify(readings));
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
