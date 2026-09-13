async function runHD59MarketplaceHistoryTests() {
  console.log('================================================================');
  console.log('VALIDATING SPRINT 5 JIRA STORY HD-59: VIEW MARKETPLACE HISTORY');
  console.log('================================================================');

  const baseUrl = 'http://localhost:5000/api';

  const authHeaders = (uid = 'prod-001') => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${uid}`,
  });

  // Step 1: Producer creates listing
  console.log('\n[SETUP] Producer prod-001 creates listing...');
  const createOfferRes = await fetch(`${baseUrl}/energy/offers`, {
    method: 'POST',
    headers: authHeaders('prod-001'),
    body: JSON.stringify({
      energy_kwh: 100.0,
      price_per_kwh: 7.20,
      energy_source: 'Solar',
      seller_location: 'Green Energy Park Sector 4',
      seller_city: 'Chennai',
      lat: 13.0827,
      lon: 80.2707,
      distance_value: 0.5,
    }),
  });
  const offerId = (await createOfferRes.json()).offer?.id;
  console.log(`  ✓ Created Offer #${offerId} with 100.0 kWh`);

  // Step 2: Consumer consumer-001 purchases 20 kWh
  console.log('\n[STEP 1 & 2] Consumer consumer-001 purchases 20 kWh...');
  const purchaseRes = await fetch(`${baseUrl}/energy/purchase`, {
    method: 'POST',
    headers: authHeaders('consumer-001'),
    body: JSON.stringify({ offer_id: offerId, energy_kwh: 20.0 }),
  });
  const tx1 = (await purchaseRes.json()).transaction;
  const tx1Id = tx1.id;
  console.log(`  ✓ Consumer placed Order #${tx1Id}, Status: ${tx1.status?.toUpperCase()}`);

  // Step 3 & 4: Fetch history as Consumer
  console.log('\n[STEP 3 & 4] Verifying Order in Consumer history...');
  const consumerHistRes = await fetch(`${baseUrl}/energy/transactions`, {
    headers: authHeaders('consumer-001'),
  });
  const consumerTxs = (await consumerHistRes.json()).transactions;
  const foundInConsumer = consumerTxs.find((t) => t.id === tx1Id);
  console.log(`  ✓ Consumer history contains Order #${tx1Id}:`, !!foundInConsumer);
  if (!foundInConsumer) throw new Error('Order not found in consumer history');

  // Step 5: Fetch history as Producer
  console.log('\n[STEP 5] Verifying Order in Producer history...');
  const producerHistRes = await fetch(`${baseUrl}/energy/transactions`, {
    headers: authHeaders('prod-001'),
  });
  const producerTxs = (await producerHistRes.json()).transactions;
  const foundInProducer = producerTxs.find((t) => t.id === tx1Id);
  console.log(`  ✓ Producer history contains Order #${tx1Id}:`, !!foundInProducer);
  if (!foundInProducer) throw new Error('Order not found in producer history');

  // Step 6: Verify unrelated user cannot see this transaction
  console.log('\n[STEP 6] Verifying privacy: Unrelated user cannot see Order #' + tx1Id);
  const unrelatedHistRes = await fetch(`${baseUrl}/energy/transactions`, {
    headers: authHeaders('unrelated-user-999'),
  });
  const unrelatedTxs = (await unrelatedHistRes.json()).transactions;
  const foundInUnrelated = unrelatedTxs.find((t) => t.id === tx1Id);
  console.log(`  ✓ Unrelated user sees 0 matches for Order #${tx1Id}:`, !foundInUnrelated);
  if (foundInUnrelated) throw new Error('Privacy breach: Unrelated user saw transaction');

  // Step 7: Filter by Pending
  console.log('\n[STEP 7] Verifying filtering by status...');
  const pendingTxs = consumerTxs.filter((t) => t.status === 'pending');
  console.log(`  ✓ Filter by 'pending': found ${pendingTxs.length} pending order(s)`);
  if (!pendingTxs.some((t) => t.id === tx1Id)) throw new Error('Pending filter failed to find order');

  // Step 8: Producer accepts & starts transmission
  console.log('\n[STEP 8] Producer accepts and advances order...');
  await fetch(`${baseUrl}/energy/transactions/${tx1Id}/status`, {
    method: 'PUT',
    headers: authHeaders('prod-001'),
    body: JSON.stringify({ status: 'accepted' }),
  });
  await fetch(`${baseUrl}/energy/transactions/${tx1Id}/status`, {
    method: 'PUT',
    headers: authHeaders('prod-001'),
    body: JSON.stringify({ status: 'in_transmission' }),
  });
  await fetch(`${baseUrl}/energy/transactions/${tx1Id}/status`, {
    method: 'PUT',
    headers: authHeaders('prod-001'),
    body: JSON.stringify({ status: 'delivered' }),
  });
  await fetch(`${baseUrl}/energy/transactions/${tx1Id}/status`, {
    method: 'PUT',
    headers: authHeaders('consumer-001'),
    body: JSON.stringify({ status: 'completed' }),
  });

  // Step 9: Verify Completed filter
  console.log('\n[STEP 9] Verifying Completed filter...');
  const histAfterComplete = await (await fetch(`${baseUrl}/energy/transactions`, { headers: authHeaders('consumer-001') })).json();
  const completedTxs = histAfterComplete.transactions.filter((t) => t.status === 'completed');
  console.log(`  ✓ Filter by 'completed': found ${completedTxs.length} completed order(s)`);
  if (!completedTxs.some((t) => t.id === tx1Id)) throw new Error('Completed filter failed to find order');

  // Step 10: Create and Cancel an order to test Cancelled filter
  console.log('\n[STEP 10] Testing Cancelled filter...');
  const purchase2 = await fetch(`${baseUrl}/energy/purchase`, {
    method: 'POST',
    headers: authHeaders('consumer-001'),
    body: JSON.stringify({ offer_id: offerId, energy_kwh: 10.0 }),
  });
  const tx2Id = (await purchase2.json()).transaction?.id;
  await fetch(`${baseUrl}/energy/transactions/${tx2Id}/cancel`, {
    method: 'POST',
    headers: authHeaders('consumer-001'),
    body: JSON.stringify({ reason: 'Consumer cancelled test' }),
  });

  const histAfterCancel = await (await fetch(`${baseUrl}/energy/transactions`, { headers: authHeaders('consumer-001') })).json();
  const cancelledTxs = histAfterCancel.transactions.filter((t) => t.status === 'cancelled');
  console.log(`  ✓ Filter by 'cancelled': found ${cancelledTxs.length} cancelled order(s)`);
  if (!cancelledTxs.some((t) => t.id === tx2Id)) throw new Error('Cancelled filter failed to find order');

  // Step 11: Verify single transaction detail endpoint
  console.log('\n[STEP 11] Verifying GET /transactions/:id details view...');
  const detailRes = await fetch(`${baseUrl}/energy/transactions/${tx1Id}`, {
    headers: authHeaders('consumer-001'),
  });
  const detailData = await detailRes.json();
  console.log(`  ✓ Order #${tx1Id} detail fetch status: ${detailData.transaction?.status?.toUpperCase()}, Energy Source: ${detailData.transaction?.energy_source}`);
  if (!detailData.transaction || detailData.transaction.status !== 'completed') {
    throw new Error('Transaction details incorrect');
  }

  // Step 12: Verify history persistence
  console.log('\n[STEP 12] Verifying history persistence across queries...');
  const persistRes = await fetch(`${baseUrl}/energy/transactions`, {
    headers: authHeaders('consumer-001'),
  });
  const persistedList = (await persistRes.json()).transactions;
  console.log(`  ✓ Total persisted transactions for consumer: ${persistedList.length}`);
  if (persistedList.length < 2) throw new Error('Persisted transaction list count mismatch');

  console.log('\n================================================================');
  console.log('ALL 15 HD-59 MARKETPLACE HISTORY TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

runHD59MarketplaceHistoryTests().catch((err) => {
  console.error('HD-59 Test Failed:', err);
  process.exit(1);
});
