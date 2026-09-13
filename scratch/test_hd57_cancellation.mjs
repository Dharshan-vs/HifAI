async function runHD57CancellationTests() {
  console.log('================================================================');
  console.log('VALIDATING SPRINT 5 JIRA STORY HD-57: CANCEL ENERGY ORDER');
  console.log('================================================================');

  const baseUrl = 'http://localhost:5000/api';

  const authHeaders = (uid = 'prod-001') => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${uid}`,
  });

  // Setup: Create a producer listing
  const createOfferRes = await fetch(`${baseUrl}/energy/offers`, {
    method: 'POST',
    headers: authHeaders('prod-001'),
    body: JSON.stringify({
      energy_kwh: 50.0,
      price_per_kwh: 7.20,
      energy_source: 'Solar',
      seller_location: 'Solar Array Zone C',
      seller_city: 'Chennai',
      lat: 13.0827,
      lon: 80.2707,
      distance_value: 0.4,
    }),
  });
  const offerId = (await createOfferRes.json()).offer?.id;
  console.log(`Setup: Created Offer #${offerId} with 50.0 kWh available`);

  // TEST 1: Create listing -> purchase energy -> pending -> cancel
  console.log('\n[TEST 1] Testing PENDING order cancellation & duplicate block...');
  const purchase1 = await fetch(`${baseUrl}/energy/purchase`, {
    method: 'POST',
    headers: authHeaders('consumer-001'),
    body: JSON.stringify({ offer_id: offerId, energy_kwh: 10.0 }),
  });
  const tx1Id = (await purchase1.json()).transaction?.id;
  console.log(`  ✓ Created Order #${tx1Id} (10.0 kWh, ₹72.00, PENDING)`);

  const cancel1 = await fetch(`${baseUrl}/energy/transactions/${tx1Id}/cancel`, {
    method: 'POST',
    headers: authHeaders('consumer-001'),
    body: JSON.stringify({ reason: 'Placed order by mistake' }),
  });
  const cancel1Data = await cancel1.json();
  console.log(`  ✓ Cancel response: ${cancel1Data.message}`);
  console.log(`  ✓ Status: ${cancel1Data.transaction?.status}`);
  console.log(`  ✓ Refund amount: ₹${cancel1Data.refund_amount}`);
  console.log(`  ✓ Restored kWh: ${cancel1Data.restored_kwh} kWh`);

  if (cancel1Data.transaction?.status !== 'cancelled') throw new Error('Status should be cancelled');
  if (cancel1Data.refund_amount !== 72.0) throw new Error('Refund amount should be 72.0');
  if (cancel1Data.restored_kwh !== 10.0) throw new Error('Restored kWh should be 10.0');

  // Verify duplicate cancellation attempt is blocked
  const dupCancel = await fetch(`${baseUrl}/energy/transactions/${tx1Id}/cancel`, {
    method: 'POST',
    headers: authHeaders('consumer-001'),
    body: JSON.stringify({ reason: 'Duplicate attempt' }),
  });
  console.log(`  ✓ Duplicate cancellation attempt rejected with code: ${dupCancel.status}`);
  if (dupCancel.status !== 400) throw new Error('Duplicate cancellation should return 400');

  // TEST 2: Create listing -> purchase -> accept -> cancel
  console.log('\n[TEST 2] Testing ACCEPTED order cancellation & energy restoration...');
  const purchase2 = await fetch(`${baseUrl}/energy/purchase`, {
    method: 'POST',
    headers: authHeaders('consumer-001'),
    body: JSON.stringify({ offer_id: offerId, energy_kwh: 15.0 }),
  });
  const tx2Id = (await purchase2.json()).transaction?.id;

  // Producer accepts
  await fetch(`${baseUrl}/energy/transactions/${tx2Id}/status`, {
    method: 'PUT',
    headers: authHeaders('prod-001'),
    body: JSON.stringify({ status: 'accepted' }),
  });

  const cancel2 = await fetch(`${baseUrl}/energy/transactions/${tx2Id}/cancel`, {
    method: 'POST',
    headers: authHeaders('consumer-001'),
    body: JSON.stringify({ reason: 'Unable to fulfill energy request' }),
  });
  const cancel2Data = await cancel2.json();
  console.log(`  ✓ Cancelled ACCEPTED order #${tx2Id}: ${cancel2Data.message}`);
  if (cancel2Data.transaction?.status !== 'cancelled') throw new Error('Status should be cancelled');

  // TEST 3: Complete an order (pending -> accepted -> in_transmission -> delivered -> completed) -> try cancel -> blocked
  console.log('\n[TEST 3] Testing completed order cannot be cancelled...');
  const purchase3 = await fetch(`${baseUrl}/energy/purchase`, {
    method: 'POST',
    headers: authHeaders('consumer-001'),
    body: JSON.stringify({ offer_id: offerId, energy_kwh: 5.0 }),
  });
  const tx3Id = (await purchase3.json()).transaction?.id;

  await fetch(`${baseUrl}/energy/transactions/${tx3Id}/status`, {
    method: 'PUT',
    headers: authHeaders('prod-001'),
    body: JSON.stringify({ status: 'accepted' }),
  });
  await fetch(`${baseUrl}/energy/transactions/${tx3Id}/status`, {
    method: 'PUT',
    headers: authHeaders('prod-001'),
    body: JSON.stringify({ status: 'in_transmission' }),
  });
  await fetch(`${baseUrl}/energy/transactions/${tx3Id}/status`, {
    method: 'PUT',
    headers: authHeaders('prod-001'),
    body: JSON.stringify({ status: 'delivered' }),
  });
  await fetch(`${baseUrl}/energy/transactions/${tx3Id}/status`, {
    method: 'PUT',
    headers: authHeaders('prod-001'),
    body: JSON.stringify({ status: 'completed' }),
  });

  const cancelCompleted = await fetch(`${baseUrl}/energy/transactions/${tx3Id}/cancel`, {
    method: 'POST',
    headers: authHeaders('consumer-001'),
    body: JSON.stringify({ reason: 'Trying to cancel completed' }),
  });
  console.log(`  ✓ Cancel attempt on COMPLETED order rejected with code: ${cancelCompleted.status}`);
  if (cancelCompleted.status !== 400) throw new Error('Cancelling completed order should return 400');

  // TEST 4: State persistence after cancellation
  console.log('\n[TEST 4] Testing cancellation state persistence...');
  const getTxRes = await fetch(`${baseUrl}/energy/transactions/${tx1Id}`, {
    headers: authHeaders('consumer-001'),
  });
  const persistedTx = (await getTxRes.json()).transaction;
  console.log(`  ✓ Re-fetched Order #${tx1Id} status: '${persistedTx.status}'`);
  if (persistedTx.status !== 'cancelled') throw new Error('Persisted status must be cancelled');

  // TEST 5: Unauthorized user cannot cancel another user's order
  console.log('\n[TEST 5] Testing unauthorized user cancellation protection...');
  const purchase4 = await fetch(`${baseUrl}/energy/purchase`, {
    method: 'POST',
    headers: authHeaders('consumer-001'),
    body: JSON.stringify({ offer_id: offerId, energy_kwh: 5.0 }),
  });
  const tx4Id = (await purchase4.json()).transaction?.id;

  const unauthCancel = await fetch(`${baseUrl}/energy/transactions/${tx4Id}/cancel`, {
    method: 'POST',
    headers: authHeaders('stranger-999'),
    body: JSON.stringify({ reason: 'Malicious cancel' }),
  });
  console.log(`  ✓ Unauthorized cancel attempt rejected with code: ${unauthCancel.status}`);
  if (unauthCancel.status !== 403) throw new Error('Unauthorized cancellation should return 403');

  console.log('\n================================================================');
  console.log('ALL 5 HD-57 CANCELLATION TESTS PASSED PERFECTLY!');
  console.log('================================================================');
}

runHD57CancellationTests().catch((err) => {
  console.error('HD-57 Test Failed:', err);
  process.exit(1);
});
