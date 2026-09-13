import { fetchEnergyOffers, createEnergyOffer } from '../src/services/marketplaceService.js';

async function runTests() {
  console.log('--- Testing HD-49 View Available Listings & HD-48 Integration ---');

  // 1. Fetch available offers
  const initialOffers = await fetchEnergyOffers();
  console.log(`Initial active offers count: ${initialOffers.length}`);
  console.log('Energy sources found:', [...new Set(initialOffers.map(o => o.energy_source))]);

  // 2. Create a new energy listing via HD-48
  const newOfferPayload = {
    energy_kwh: 14.0,
    price_per_kwh: 6.75,
    energy_source: 'Solar',
    seller_name: 'Test Prosumer Green',
    seller_location: 'Green Valley Rooftop Microgrid',
    seller_city: 'Chennai',
    lat: 13.0830,
    lon: 80.2710,
    distance_value: 0.45,
    available_from: new Date().toISOString(),
    available_until: new Date(Date.now() + 10 * 3600 * 1000).toISOString(),
  };

  const createdRes = await createEnergyOffer(newOfferPayload);
  console.log('Created offer result:', createdRes?.offer?.id || createdRes?.id);

  // 3. Fetch again to verify the newly created listing appears
  const updatedOffers = await fetchEnergyOffers();
  const createdFound = updatedOffers.find(o => o.seller_name === 'Test Prosumer Green' || o.id === (createdRes?.offer?.id || createdRes?.id));
  console.log(`Updated active offers count: ${updatedOffers.length}`);
  console.log(`Found newly created HD-48 offer in HD-49 listings: ${!!createdFound}`);

  // 4. Verify inactive listings are not shown
  const inactiveFound = updatedOffers.find(o => o.remaining_kwh <= 0 || o.status === 'completed' || o.id === 107);
  console.log(`Inactive listing excluded: ${!inactiveFound}`);
}

runTests().catch(console.error);
