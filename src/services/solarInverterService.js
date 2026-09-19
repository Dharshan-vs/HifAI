/* Solar Inverter Service */

export const INITIAL_INVERTERS = [];

export const INITIAL_SOLAR_GENERATION = [];

const LOCAL_INVERTERS_KEY = 'hifai_registered_solar_inverters';
const LOCAL_GENERATION_KEY = 'hifai_registered_solar_generation';

function getLocalInverters(userId = 'guest') {
  try {
    const key = `${LOCAL_INVERTERS_KEY}_${userId || 'guest'}`;
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

function saveLocalInverters(userId = 'guest', inverters) {
  try {
    const key = `${LOCAL_INVERTERS_KEY}_${userId || 'guest'}`;
    localStorage.setItem(key, JSON.stringify(inverters));
  } catch (e) {
    console.error('LocalStorage save inverters error:', e);
  }
}

function getLocalGeneration(userId = 'guest') {
  try {
    const key = `${LOCAL_GENERATION_KEY}_${userId || 'guest'}`;
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

function saveLocalGeneration(userId = 'guest', items) {
  try {
    const key = `${LOCAL_GENERATION_KEY}_${userId || 'guest'}`;
    localStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.error('LocalStorage save generation error:', e);
  }
}

export async function fetchSolarInverters(userId = 'guest') {
  return getLocalInverters(userId);
}

export async function registerSolarInverter(userId = 'guest', inverterData) {
  const newInverter = {
    id: `INV-LOCAL-${Date.now()}`,
    userId,
    ...inverterData,
    isSimulationMode: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const current = getLocalInverters(userId);
  const updated = [newInverter, ...current.filter((i) => i.id !== newInverter.id)];
  saveLocalInverters(userId, updated);
  return newInverter;
}

export async function updateSolarInverter(userId = 'guest', id, inverterData) {
  const current = getLocalInverters(userId);
  const updated = current.map((inv) =>
    inv.id === id ? { ...inv, ...inverterData, updatedAt: new Date().toISOString() } : inv
  );
  saveLocalInverters(userId, updated);
  return { id, ...inverterData };
}

export async function deleteSolarInverter(userId = 'guest', id) {
  const current = getLocalInverters(userId);
  const updated = current.filter((inv) => inv.id !== id);
  saveLocalInverters(userId, updated);
  return { success: true, id };
}

export async function fetchSolarGeneration(userId = 'guest') {
  return getLocalGeneration(userId);
}

export async function addSolarGenerationEntry(userId = 'guest', generationData) {
  const newEntry = {
    id: `GEN-LOCAL-${Date.now()}`,
    userId,
    ...generationData,
    source: generationData.source || 'Manual Entry (Simulation Mode)',
    timestamp: generationData.timestamp || new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  const current = getLocalGeneration(userId);
  const updated = [newEntry, ...current.filter((g) => g.id !== newEntry.id)];
  saveLocalGeneration(userId, updated);
  return newEntry;
}

export async function updateSolarGenerationEntry(id, generationData, userId = 'guest') {
  const targetUser = generationData.userId || userId;
  const current = getLocalGeneration(targetUser);
  const updated = current.map((g) => (g.id === id ? { ...g, ...generationData } : g));
  saveLocalGeneration(targetUser, updated);
  return { id, ...generationData };
}

export async function deleteSolarGenerationEntry(id, userId = 'guest') {
  const current = getLocalGeneration(userId);
  const updated = current.filter((g) => g.id !== id);
  saveLocalGeneration(userId, updated);
  return true;
}
