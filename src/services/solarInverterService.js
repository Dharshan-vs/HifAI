/* Solar Inverter Service */

export const INITIAL_INVERTERS = [];

export const INITIAL_SOLAR_GENERATION = [];

const LOCAL_INVERTERS_KEY = 'hifai_registered_solar_inverters';
const LOCAL_GENERATION_KEY = 'hifai_registered_solar_generation';

function getLocalInverters(userId = 'guest') {
  try {
    const key = userId === 'guest' ? LOCAL_INVERTERS_KEY : `${LOCAL_INVERTERS_KEY}_${userId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }

    const fallbackKeys = [
      LOCAL_INVERTERS_KEY,
      `${LOCAL_INVERTERS_KEY}_guest`,
      `${LOCAL_INVERTERS_KEY}_google_demo_user`,
      `${LOCAL_INVERTERS_KEY}_demo-user-001`,
    ];

    for (const fbKey of fallbackKeys) {
      const fbRaw = localStorage.getItem(fbKey);
      if (fbRaw) {
        const parsed = JSON.parse(fbRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          saveLocalInverters(userId, parsed);
          return parsed;
        }
      }
    }

    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && storageKey.startsWith(LOCAL_INVERTERS_KEY)) {
        const val = localStorage.getItem(storageKey);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed) && parsed.length > 0) {
              saveLocalInverters(userId, parsed);
              return parsed;
            }
          } catch {}
        }
      }
    }

    return INITIAL_INVERTERS.map((i) => ({ ...i, userId }));
  } catch {
    return INITIAL_INVERTERS.map((i) => ({ ...i, userId }));
  }
}

function saveLocalInverters(userId = 'guest', inverters) {
  try {
    const key = userId === 'guest' ? LOCAL_INVERTERS_KEY : `${LOCAL_INVERTERS_KEY}_${userId}`;
    localStorage.setItem(key, JSON.stringify(inverters));
    localStorage.setItem(LOCAL_INVERTERS_KEY, JSON.stringify(inverters));
  } catch (e) {
    console.error('LocalStorage save inverters error:', e);
  }
}

function getLocalGeneration(userId = 'guest') {
  try {
    const key = userId === 'guest' ? LOCAL_GENERATION_KEY : `${LOCAL_GENERATION_KEY}_${userId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }

    const fallbackKeys = [
      LOCAL_GENERATION_KEY,
      `${LOCAL_GENERATION_KEY}_guest`,
      `${LOCAL_GENERATION_KEY}_google_demo_user`,
      `${LOCAL_GENERATION_KEY}_demo-user-001`,
    ];

    for (const fbKey of fallbackKeys) {
      const fbRaw = localStorage.getItem(fbKey);
      if (fbRaw) {
        const parsed = JSON.parse(fbRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          saveLocalGeneration(userId, parsed);
          return parsed;
        }
      }
    }

    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && storageKey.startsWith(LOCAL_GENERATION_KEY)) {
        const val = localStorage.getItem(storageKey);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed) && parsed.length > 0) {
              saveLocalGeneration(userId, parsed);
              return parsed;
            }
          } catch {}
        }
      }
    }

    return INITIAL_SOLAR_GENERATION.map((g) => ({ ...g, userId }));
  } catch {
    return INITIAL_SOLAR_GENERATION.map((g) => ({ ...g, userId }));
  }
}

function saveLocalGeneration(userId = 'guest', items) {
  try {
    const key = userId === 'guest' ? LOCAL_GENERATION_KEY : `${LOCAL_GENERATION_KEY}_${userId}`;
    localStorage.setItem(key, JSON.stringify(items));
    localStorage.setItem(LOCAL_GENERATION_KEY, JSON.stringify(items));
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
