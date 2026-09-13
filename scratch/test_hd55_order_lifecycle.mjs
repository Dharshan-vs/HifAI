async function runHD55OrderLifecycleTests() {
  console.log('================================================================');
  console.log('VALIDATING SPRINT 5 JIRA STORY HD-55: MANAGE ENERGY ORDERS');
  console.log('================================================================');

  const baseUrl = 'http://localhost:5000/api';

  // Helper with dev auth headers
  const authHeaders = (uid = 'prod-001') => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${uid}`,
  });

  // Step 1: Create an energy listing (HD-48)
  console.log('\n[STEP 1] Producer creates energy listing...');
  const createOfferRes = await fetch(`${baseUrl}/energy/offers`, {
    method: 'POST',
    headers: authHeaders('prod-001'),
    body: JSON.stringify({
      energy_kwh: 30.0,
      price_per_kwh: 7.50,
      energy_source: 'Solar',
      seller_location: 'Rooftop Microgrid Station A',
      seller_city: 'Chennai',
      lat: 13.0827,
      lon: 80.2707,
      distance_value: 0.4,
    }),
  });
  const offerData = await createOfferRes.json();
  const offerId = offerData.offer?.id;
  console.log(`  ✓ Offer created with ID: #${offerId} (30.0 kWh @ ₹7.50/kWh)`);

  // Step 2: Consumer purchases 10 kWh (HD-53)
  console.log('\n[STEP 2] Consumer purchases 10 kWh energy...');
  const purchaseRes = await fetch(`${baseUrl}/energy/purchase`, {
    method: 'POST',
    headers: authHeaders('consumer-001'),
    body: JSON.stringify({
      offer_id: offerId,
      energy_kwh: 10.0,
    }),
  });
  const purchaseData = await purchaseRes.json();
  const txId = purchaseData.transaction?.id;
  console.log(`  ✓ Purchase created Order #${txId}, Status: ${purchaseData.transaction?.status?.toUpperCase()}`);

  // Step 3: Consumer checks order status (should be 'pending')
  console.log('\n[STEP 3 & 4] Verifying order visibility and initial status...');
  const getTxRes1 = await fetch(`${baseUrl}/energy/transactions/${txId}`, {
    headers: authHeaders('consumer-001'),
  });
  const tx1 = (await getTxRes1.json()).transaction;
  console.log(`  ✓ Order #${txId} status: '${tx1.status}' (Pending Approval)`);
  if (tx1.status !== 'pending') throw new Error(`Expected pending, got ${tx1.status}`);

  // Step 5: Producer accepts order (PENDING -> ACCEPTED)
  console.log('\n[STEP 5 & 6] Producer accepts order...');
  const acceptRes = await fetch(`${baseUrl}/energy/transactions/${txId}/status`, {
    method: 'PUT',
    headers: authHeaders('prod-001'),
    body: JSON.stringify({ status: 'accepted' }),
  });
  const acceptData = await acceptRes.json();
  console.log(`  ✓ Status updated: '${acceptData.transaction?.status}' (ACCEPTED)`);
  if (acceptData.transaction?.status !== 'accepted') throw new Error('Expected accepted status');

  // Step 7: Producer starts transmission (ACCEPTED -> IN_TRANSMISSION)
  console.log('\n[STEP 7 & 8] Producer starts transmission...');
  const transmitRes = await fetch(`${baseUrl}/energy/transactions/${txId}/status`, {
    method: 'PUT',
    headers: authHeaders('prod-001'),
    body: JSON.stringify({ status: 'in_transmission' }),
  });
  const transmitData = await transmitRes.json();
  console.log(`  ✓ Status updated: '${transmitData.transaction?.status}' (IN_TRANSMISSION)`);
  if (transmitData.transaction?.status !== 'in_transmission') throw new Error('Expected in_transmission status');

  // Step 9: Producer confirms delivery (IN_TRANSMISSION -> DELIVERED)
  console.log('\n[STEP 9 & 10] Producer marks energy delivered...');
  const deliverRes = await fetch(`${baseUrl}/energy/transactions/${txId}/status`, {
    method: 'PUT',
    headers: authHeaders('prod-001'),
    body: JSON.stringify({ status: 'delivered' }),
  });
  const deliverData = await deliverRes.json();
  console.log(`  ✓ Status updated: '${deliverData.transaction?.status}' (DELIVERED)`);
  if (deliverData.transaction?.status !== 'delivered') throw new Error('Expected delivered status');

  // Step 11: Final settlement (DELIVERED -> COMPLETED)
  console.log('\n[STEP 11 & 12] Final settlement and completion...');
  const completeRes = await fetch(`${baseUrl}/energy/transactions/${txId}/status`, {
    method: 'PUT',
    headers: authHeaders('consumer-001'),
    body: JSON.stringify({ status: 'completed' }),
  });
  const completeData = await completeRes.json();
  console.log(`  ✓ Status updated: '${completeData.transaction?.status}' (COMPLETED)`);
  if (completeData.transaction?.status !== 'completed') throw new Error('Expected completed status');

  // Step 13: Verify invalid state transitions are blocked (e.g. completed -> pending)
  console.log('\n[STEP 13] Verifying invalid state transitions are blocked...');
  const invalidRes = await fetch(`${baseUrl}/energy/transactions/${txId}/status`, {
    method: 'PUT',
    headers: authHeaders('prod-001'),
    body: JSON.stringify({ status: 'pending' }),
  });
  console.log(`  ✓ Transition from completed -> pending rejected with status: ${invalidRes.status}`);
  if (invalidRes.status !== 400) throw new Error('Invalid transition should return 400');

  // Step 14: Verify unauthorized user cannot modify order
  console.log('\n[STEP 14] Verifying unauthorized user protection...');
  const unauthRes = await fetch(`${baseUrl}/energy/transactions/${txId}/status`, {
    method: 'PUT',
    headers: authHeaders('unrelated-user-999'),
    body: JSON.stringify({ status: 'accepted' }),
  });
  console.log(`  ✓ Unrelated user attempt rejected with status: ${unauthRes.status}`);
  if (unauthRes.status !== 403) throw new Error('Unauthorized modification should return 403');

  // Step 15: Verify cancellation behavior
  console.log('\n[STEP 15] Verifying cancellation flow...');
  // Purchase another 5 kWh to test cancellation
  const purchase2 = await fetch(`${baseUrl}/energy/purchase`, {
    method: 'POST',
    headers: authHeaders('consumer-001'),
    body: JSON.stringify({ offer_id: offerId, energy_kwh: 5.0 }),
  });
  const tx2Id = (await purchase2.json()).transaction?.id;

  const cancelRes = await fetch(`${baseUrl}/energy/transactions/${tx2Id}/cancel`, {
    method: 'POST',
    headers: authHeaders('consumer-001'),
    body: JSON.stringify({ reason: 'Consumer requested order cancellation' }),
  });
  const cancelData = await cancelRes.json();
  console.log(`  ✓ Order #${tx2Id} successfully cancelled! Message: ${cancelData.message}`);
  if (!cancelData.success) throw new Error('Cancellation should succeed');

  console.log('\n================================================================');
  console.log('ALL 16 HD-55 ORDER LIFECYCLE TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

runHD55OrderLifecycleTests().catch((err) => {
  console.error('HD-55 Test Failed:', err);
  process.exit(1);
});
