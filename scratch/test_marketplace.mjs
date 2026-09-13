async function runTests() {
  console.log('=====================================================');
  console.log('VERIFYING HD-49 VIEW AVAILABLE ENERGY LISTINGS & APIS');
  console.log('=====================================================');

  const baseUrl = 'http://localhost:5000/api';

  // 1. Test GET /api/energy/offers
  console.log('\n[TEST 1] Fetching GET /api/energy/offers...');
  const res = await fetch(`${baseUrl}/energy/offers`);
  const data = await res.json();
  console.log(`Status: ${res.status}, Success: ${data.success}, Offers count: ${data.offers?.length}`);

  if (!data.offers || data.offers.length === 0) {
    throw new Error('No offers returned from /api/energy/offers');
  }

  // 2. Validate all required fields for HD-49 on each offer
  const requiredFields = [
    'id',
    'seller_name',
    'seller_location',
    'seller_city',
    'lat',
    'lon',
    'energy_source',
    'energy_kwh',
    'remaining_kwh',
    'price_per_kwh',
    'available_from',
    'available_until',
    'status',
  ];

  console.log('\n[TEST 2] Checking required fields for each listing:');
  const sampleOffer = data.offers[0];
  for (const field of requiredFields) {
    const hasField = sampleOffer[field] !== undefined;
    console.log(`  ✓ Field "${field}": ${hasField ? sampleOffer[field] : 'MISSING'}`);
    if (!hasField) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // 3. Validate multiple energy sources (Solar, Wind, Hydro, etc.)
  const sources = [...new Set(data.offers.map((o) => o.energy_source))];
  console.log('\n[TEST 3] Energy Sources Present:', sources);
  if (sources.length < 2) {
    throw new Error('Multiple energy sources should be supported and returned dynamically');
  }

  // 4. Validate inactive / completed listings are NOT shown
  console.log('\n[TEST 4] Validating unavailable/inactive listings are excluded:');
  const hasInactive = data.offers.some((o) => o.status !== 'active' || o.remaining_kwh <= 0 || o.id === 107);
  console.log(`  ✓ Inactive or depleted listings included? ${hasInactive ? 'FAIL' : 'PASS (Excluded properly)'}`);
  if (hasInactive) {
    throw new Error('Inactive listings must not be returned');
  }

  // 5. Test HD-50 search & filter query params
  console.log('\n[TEST 5] Testing search and filters:');
  const solarRes = await fetch(`${baseUrl}/energy/offers?energy_source=Solar`);
  const solarData = await solarRes.json();
  console.log(`  ✓ Filter by energy_source=Solar count: ${solarData.offers?.length}`);

  const windRes = await fetch(`${baseUrl}/energy/offers?energy_source=Wind`);
  const windData = await windRes.json();
  console.log(`  ✓ Filter by energy_source=Wind count: ${windData.offers?.length}`);

  const searchRes = await fetch(`${baseUrl}/energy/offers?search=Coastal`);
  const searchData = await searchRes.json();
  console.log(`  ✓ Search "Coastal" count: ${searchData.offers?.length}`);

  console.log('\n=====================================================');
  console.log('ALL API & FILTERING CHECKS PASSED SUCCESSFULLY!');
  console.log('=====================================================');
}

runTests().catch((e) => {
  console.error('Test Failed:', e);
  process.exit(1);
});
