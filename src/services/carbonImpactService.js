/* Carbon Impact Service */

export const INITIAL_CARBON_IMPACT = {
  co2SavedKg: 0,
  co2SavedTons: 0.0,
  treesEquivalent: 0,
  renewableGeneratedKwh: 0,
  coalSavedKg: 0,
  environmentalScore: 0,
  scoreGrade: 'N/A',
  monthlyTargetKwh: 1000,
  monthlyProgressPercent: 0,
  monthlyData: [],
};

const LOCAL_CARBON_KEY = 'hifai_registered_carbon_impact';

function getLocalCarbonImpact(userId = 'guest') {
  try {
    const key = userId === 'guest' ? LOCAL_CARBON_KEY : `${LOCAL_CARBON_KEY}_${userId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : { id: userId, ...INITIAL_CARBON_IMPACT };
  } catch {
    return { id: userId, ...INITIAL_CARBON_IMPACT };
  }
}

function saveLocalCarbonImpact(userId = 'guest', data) {
  try {
    const key = userId === 'guest' ? LOCAL_CARBON_KEY : `${LOCAL_CARBON_KEY}_${userId}`;
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('LocalStorage save carbon impact error:', e);
  }
}

export async function fetchCarbonImpact(userId = 'guest') {
  return getLocalCarbonImpact(userId);
}

export async function updateEnergyImpact(userId = 'guest', kwhGenerated = 0) {
  const current = getLocalCarbonImpact(userId);
  
  // Formula estimates: 0.8 kg CO2 saved per kWh solar, 0.4 kg coal saved per kWh solar, 1 tree per 20 kg CO2 saved
  const addedCo2 = kwhGenerated * 0.8;
  const addedCoal = kwhGenerated * 0.4;

  const newKwh = (current.renewableGeneratedKwh || 0) + kwhGenerated;
  const newCo2Kg = (current.co2SavedKg || 0) + addedCo2;
  const newCo2Tons = parseFloat((newCo2Kg / 1000).toFixed(2));
  const newTrees = Math.round(newCo2Kg / 20);
  const newCoalKg = (current.coalSavedKg || 0) + addedCoal;

  const updatedData = {
    ...current,
    renewableGeneratedKwh: newKwh,
    co2SavedKg: Math.round(newCo2Kg),
    co2SavedTons: newCo2Tons,
    treesEquivalent: newTrees,
    coalSavedKg: Math.round(newCoalKg),
    updatedAt: new Date().toISOString(),
  };

  saveLocalCarbonImpact(userId, updatedData);
  return updatedData;
}
