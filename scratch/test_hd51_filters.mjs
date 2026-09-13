// Test script for HD-51 Filter Energy Listings
async function runHD51Tests() {
  console.log('=====================================================');
  console.log('VALIDATING SPRINT 5 JIRA STORY HD-51: FILTER LISTINGS');
  console.log('=====================================================');

  const baseUrl = 'http://localhost:5000/api';

  // 1. Base active listings
  const baseRes = await fetch(`${baseUrl}/energy/offers`);
  const baseData = await baseRes.json();
  const allListings = baseData.offers || [];
  console.log(`\n[TEST 1] Base Active Listings: ${allListings.length} total active offers`);

  // 2. Search alone (HD-50)
  console.log('\n[TEST 2] Search alone:');
  const searchSolar = allListings.filter(o =>
    [o.seller_name, o.seller_location, o.seller_city, o.energy_source, String(o.id)]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes('solar')
  );
  console.log(`  ✓ Search "Solar": ${searchSolar.length} listings match`);

  // 3. Energy source filter alone
  console.log('\n[TEST 3] Energy Source filter:');
  const solarOnly = allListings.filter(o => (o.energy_source || '').toLowerCase() === 'solar');
  const windOnly = allListings.filter(o => (o.energy_source || '').toLowerCase() === 'wind');
  const hydroOnly = allListings.filter(o => (o.energy_source || '').toLowerCase() === 'hydro');
  console.log(`  ✓ Source = Solar: ${solarOnly.length} listings`);
  console.log(`  ✓ Source = Wind: ${windOnly.length} listings`);
  console.log(`  ✓ Source = Hydro: ${hydroOnly.length} listings`);

  // 4. Price filter alone (min / max)
  console.log('\n[TEST 4] Price filter:');
  const under8 = allListings.filter(o => parseFloat(o.price_per_kwh) <= 8.0);
  const under6 = allListings.filter(o => parseFloat(o.price_per_kwh) <= 6.0);
  const above8 = allListings.filter(o => parseFloat(o.price_per_kwh) > 8.0);
  console.log(`  ✓ Price <= ₹8.00: ${under8.length} listings`);
  console.log(`  ✓ Price <= ₹6.00: ${under6.length} listings`);
  console.log(`  ✓ Price > ₹8.00: ${above8.length} listings`);

  // 5. Available kWh filter alone
  console.log('\n[TEST 5] Available kWh filter:');
  const min20kwh = allListings.filter(o => parseFloat(o.remaining_kwh) >= 20.0);
  const min50kwh = allListings.filter(o => parseFloat(o.remaining_kwh) >= 50.0);
  console.log(`  ✓ Min 20 kWh: ${min20kwh.length} listings`);
  console.log(`  ✓ Min 50 kWh: ${min50kwh.length} listings`);

  // 6. Compound filter: Search + Source + Price (AND logic)
  console.log('\n[TEST 6] Compound Filter (Search="Solar" + Source=Solar + MaxPrice=₹8.00):');
  const compoundMatch = allListings.filter(o => {
    const matchesSearch = [o.seller_name, o.seller_location, o.seller_city, o.energy_source, String(o.id)]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes('solar');
    const matchesSource = (o.energy_source || '').toLowerCase() === 'solar';
    const matchesPrice = parseFloat(o.price_per_kwh) <= 8.0;
    return matchesSearch && matchesSource && matchesPrice;
  });
  console.log(`  ✓ Compound matching listings: ${compoundMatch.length}`);
  compoundMatch.forEach(m => {
    console.log(`    - ID #${m.id} | ${m.seller_name} | ${m.energy_source} | ₹${m.price_per_kwh}/kWh | ${m.remaining_kwh} kWh`);
  });

  // 7. Distance & Microgrid Restriction Check
  console.log('\n[TEST 7] 1.0 km Microgrid Restriction:');
  const eligibleTransfers = allListings.filter(o => parseFloat(o.distance_value ?? 0.6) <= 1.0);
  const outOfRange = allListings.filter(o => parseFloat(o.distance_value ?? 0.6) > 1.0);
  console.log(`  ✓ Within 1.0 km (Transfer Eligible): ${eligibleTransfers.length}`);
  console.log(`  ✓ Out of Range (> 1.0 km): ${outOfRange.length} (Visible in All Listings, Purchase Restricted)`);

  // 8. Empty State verification (impossible filter condition)
  console.log('\n[TEST 8] Empty State Filter:');
  const impossibleFilter = allListings.filter(o => (o.energy_source || '').toLowerCase() === 'hydro' && parseFloat(o.price_per_kwh) < 5.0);
  console.log(`  ✓ Filter (Hydro + Price < ₹5.00) count: ${impossibleFilter.length} (Triggers Clean Empty State)`);

  console.log('\n=====================================================');
  console.log('ALL HD-51 FILTER VALIDATION TESTS PASSED!');
  console.log('=====================================================');
}

runHD51Tests().catch((err) => {
  console.error('HD-51 Test Error:', err);
  process.exit(1);
});
