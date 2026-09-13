import { calculateDistanceKm, fetchEnergySummary, createEnergyOffer, purchaseEnergy, INITIAL_OFFERS } from '../src/services/marketplaceService.js';
import { fetchCarbonImpact, updateEnergyImpact } from '../src/services/carbonImpactService.js';
import { fetchSmartMeters, registerSmartMeter, fetchSmartMeterReadings } from '../src/services/smartMeterService.js';
import { fetchSolarInverters, registerSolarInverter } from '../src/services/solarInverterService.js';
import { fetchEnergyDevices, addEnergyDevice } from '../src/services/deviceService.js';
import { fetchEnergySystems, addEnergySystem } from '../src/services/systemsService.js';
import { fetchWalletSummary, requestSettlement } from '../src/services/walletService.js';
import { fetchSyncHistory, fetchDeviceStatuses } from '../src/services/syncEngineService.js';
import { predictEnergyGeneration, fetchLiveWeatherData } from '../src/services/predictionService.js';

// Setup Mock LocalStorage for Node environment
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}
global.localStorage = new MockLocalStorage();
global.window = { localStorage: global.localStorage };

async function runTests() {
  console.log('🧪 Starting YUGA / REOS Logical Validation Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name} - ${details}`);
      failed++;
    }
  }

  // --- TEST GROUP 1: Zero Baseline Defaults for New Users ---
  console.log('📌 Test Group 1: Zero-Value Baseline for New Users');
  const testUser = 'user_new_test_101';
  
  const summary = await fetchEnergySummary();
  assert(summary.solar_generated_kwh === 0, 'New user solar generation default is 0');
  assert(summary.energy_consumed_kwh === 0, 'New user energy consumed default is 0');
  assert(summary.battery_stored_kwh === 0, 'New user battery stored default is 0');

  const carbon = await fetchCarbonImpact(testUser);
  assert(carbon.co2SavedKg === 0, 'New user CO2 saved default is 0');
  assert(carbon.treesEquivalent === 0, 'New user trees planted default is 0');
  assert(carbon.coalSavedKg === 0, 'New user coal saved default is 0');

  const meters = await fetchSmartMeters(testUser);
  assert(Array.isArray(meters) && meters.length === 0, 'New user has 0 initial smart meters');

  const readings = await fetchSmartMeterReadings(testUser);
  assert(Array.isArray(readings) && readings.length === 0, 'New user has 0 initial meter readings');

  const inverters = await fetchSolarInverters(testUser);
  assert(Array.isArray(inverters) && inverters.length === 0, 'New user has 0 initial solar inverters');

  const devices = await fetchEnergyDevices(testUser);
  assert(Array.isArray(devices) && devices.length === 0, 'New user has 0 initial energy devices');

  const systems = await fetchEnergySystems(testUser);
  assert(Array.isArray(systems) && systems.length === 0, 'New user has 0 initial solar systems');

  const wallet = await fetchWalletSummary(testUser);
  assert(wallet.balance === 0, 'New user wallet balance default is 0');
  assert(wallet.todayEarnings === 0, 'New user earnings default is 0');

  const syncHist = await fetchSyncHistory(testUser);
  assert(Array.isArray(syncHist) && syncHist.length === 0, 'New user has 0 sync history logs');

  const devStatuses = await fetchDeviceStatuses(testUser);
  assert(Array.isArray(devStatuses) && devStatuses.length === 0, 'New user has 0 device sync statuses');

  // --- TEST GROUP 2: Multi-Tenant Data Isolation ---
  console.log('\n📌 Test Group 2: Multi-Tenant Isolation & Persistence');
  const userA = 'user_tenant_A';
  const userB = 'user_tenant_B';

  await addEnergyDevice(userA, { deviceName: 'User A Smart Meter', deviceType: 'Smart Meter' });
  const userADevices = await fetchEnergyDevices(userA);
  const userBDevices = await fetchEnergyDevices(userB);

  assert(userADevices.length === 1 && userADevices[0].deviceName === 'User A Smart Meter', 'User A can register and retrieve their own device');
  assert(userBDevices.length === 0, 'User B does not see User A registered devices (Isolation check)');

  await registerSmartMeter(userA, { name: 'User A Meter', serialNumber: 'SN-A-123' });
  const userAMeters = await fetchSmartMeters(userA);
  const userBMeters = await fetchSmartMeters(userB);
  assert(userAMeters.length === 1 && userAMeters[0].serialNumber === 'SN-A-123', 'User A has their registered meter');
  assert(userBMeters.length === 0, 'User B has 0 meters isolated from User A');

  await registerSolarInverter(userA, { model: 'Inverter-A', capacityKw: 5 });
  const userAInverters = await fetchSolarInverters(userA);
  const userBInverters = await fetchSolarInverters(userB);
  assert(userAInverters.length === 1 && userAInverters[0].model === 'Inverter-A', 'User A has their registered inverter');
  assert(userBInverters.length === 0, 'User B has 0 inverters isolated from User A');

  // --- TEST GROUP 3: 1.0 km Microgrid Distance & Calculations ---
  console.log('\n📌 Test Group 3: Microgrid Distance Rules & P2P Constraints');
  const dWithin = calculateDistanceKm(13.0827, 80.2707, 13.0850, 80.2730);
  assert(dWithin <= 1.0, `Within 1km distance check (Calculated: ${dWithin} km <= 1.0 km)`);

  const dOutside = calculateDistanceKm(13.0827, 80.2707, 13.1100, 80.3100);
  assert(dOutside > 1.0, `Outside 1km distance check (Calculated: ${dOutside} km > 1.0 km)`);

  let distanceBlocked = false;
  try {
    await purchaseEnergy('OFFER-TEST', 5, { seller_name: 'Far Producer' }, 2.5);
  } catch (err) {
    if (err.message.includes('1.0 km')) distanceBlocked = true;
  }
  assert(distanceBlocked, 'Purchase exceeds 1.0 km radius is strictly rejected');

  // --- TEST GROUP 4: Dynamic Buyer Attribution in Purchase ---
  console.log('\n📌 Test Group 4: Dynamic Buyer Attribution in Marketplace');
  const buyerProfile = { displayName: 'Priya Sharma', email: 'priya@chennai-microgrid.in' };
  const purchaseTx = await purchaseEnergy('OFFER-TEST', 10, { seller_name: 'Neighborhood Rooftop Solar' }, 0.5, buyerProfile);
  assert(purchaseTx.buyer_name === 'Priya Sharma', `Buyer name correctly attributed to active user (${purchaseTx.buyer_name})`);
  assert(purchaseTx.units_kwh === 10, 'Purchase transaction correctly logs units (10 kWh)');

  // --- TEST GROUP 5: Environmental Carbon Calculations ---
  console.log('\n📌 Test Group 5: Carbon Calculation Logic');
  const updatedImpact = await updateEnergyImpact(testUser, 10); // 10 kWh solar
  assert(updatedImpact.renewableGeneratedKwh === 10, '10 kWh renewable logged');
  assert(updatedImpact.co2SavedKg === 8, '8 kg CO2 saved for 10 kWh (0.8 kg/kWh)');
  assert(updatedImpact.coalSavedKg === 4, '4 kg Coal saved for 10 kWh (0.4 kg/kWh)');

  // --- TEST GROUP 6: Single System Limit for Marketplace Verification ---
  console.log('\n📌 Test Group 6: Producer Single System Limit Verification');
  const producerUser = 'prod_single_sys_test';
  await addEnergySystem(producerUser, { name: 'Main Solar Array', capacity: 5.0 });
  let limitEnforced = false;
  try {
    await addEnergySystem(producerUser, { name: 'Second Solar Array', capacity: 3.0 });
  } catch (err) {
    if (err.message.includes('Single System Limit')) limitEnforced = true;
  }
  assert(limitEnforced, 'Single solar system limit enforced per producer');

  // --- SUMMARY ---
  console.log(`\n========================================`);
  console.log(`🎯 Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test runner encountered error:', err);
  process.exit(1);
});
