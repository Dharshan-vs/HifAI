/* Energy Systems Service */

export const INITIAL_SYSTEMS = [];

const LOCAL_SYSTEMS_KEY = 'hifai_registered_solar_systems';

function getLocalSystems(userId = 'guest') {
  try {
    const key = `${LOCAL_SYSTEMS_KEY}_${userId || 'guest'}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

function saveLocalSystems(userId = 'guest', list) {
  try {
    const key = `${LOCAL_SYSTEMS_KEY}_${userId || 'guest'}`;
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.error('LocalStorage save systems error:', e);
  }
}

export async function fetchEnergySystems(userId = 'guest') {
  return getLocalSystems(userId);
}

export async function addEnergySystem(userId = 'guest', systemData) {
  const existingSystems = await fetchEnergySystems(userId);
  if (existingSystems && existingSystems.length >= 1) {
    // Return existing system instead of throwing, or update it
    return existingSystems[0];
  }

  const newSys = {
    id: `SYS-SOLAR-${Math.floor(10000 + Math.random() * 90000)}`,
    userId,
    meterStatus: 'Meter Connected',
    verificationStatus: 'Marketplace Verified',
    meterSerialNumber: systemData.meterSerialNumber || `EM-SOLAR-${Math.floor(100000 + Math.random() * 900000)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...systemData,
  };

  const list = getLocalSystems(userId);
  const updatedList = [newSys, ...list.filter((s) => s.id !== newSys.id)];
  saveLocalSystems(userId, updatedList);
  return newSys;
}

export async function updateEnergySystem(id, systemData) {
  const userId = systemData.userId || 'guest';
  const list = getLocalSystems(userId);
  const updatedList = list.map((s) =>
    s.id === id ? { ...s, ...systemData, updatedAt: new Date().toISOString() } : s
  );
  saveLocalSystems(userId, updatedList);
  return { id, ...systemData };
}

export async function deleteEnergySystem(id, userId = 'guest') {
  const list = getLocalSystems(userId);
  const filtered = list.filter((s) => s.id !== id);
  saveLocalSystems(userId, filtered);
  return true;
}
