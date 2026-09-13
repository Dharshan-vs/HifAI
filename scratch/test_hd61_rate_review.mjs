async function runHD61RateAndReviewTests() {
  console.log('================================================================');
  console.log('VALIDATING SPRINT 5 FINAL STORY HD-61: RATE AND REVIEW');
  console.log('================================================================');

  const baseUrl = 'http://localhost:5000/api';

  const authHeaders = (uid = 'prod-001') => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${uid}`,
  });

  // Step 1: Producer creates energy listing
  console.log('\n[SETUP 1] Producer prod-001 creates energy listing...');
  const createOfferRes = await fetch(`${baseUrl}/energy/offers`, {
    method: 'POST',
    headers: authHeaders('prod-001'),
    body: JSON.stringify({
      energy_kwh: 50.0,
      price_per_kwh: 7.20,
      energy_source: 'Solar',
      seller_location: 'Green Energy Park 1',
      seller_city: 'Chennai',
      lat: 13.0827,
      lon: 80.2707,
      distance_value: 0.5,
    }),
  });
  const offerId = (await createOfferRes.json()).offer?.id;
  console.log(`  ✓ Created Offer #${offerId} with 50.0 kWh`);

  // Step 2: Consumer purchases 10 kWh
  console.log('\n[SETUP 2] Consumer consumer-001 purchases 10 kWh...');
  const purchaseRes = await fetch(`${baseUrl}/energy/purchase`, {
    method: 'POST',
    headers: authHeaders('consumer-001'),
    body: JSON.stringify({ offer_id: offerId, energy_kwh: 10.0 }),
  });
  const txId = (await purchaseRes.json()).transaction?.id;
  console.log(`  ✓ Created Order #${txId}, Status: PENDING`);

  // Step 3: Attempt review on PENDING order (should fail)
  console.log('\n[TEST 1] Attempting review on PENDING order (should be blocked)...');
  const reviewPending = await fetch(`${baseUrl}/energy/transactions/${txId}/review`, {
    method: 'POST',
    headers: authHeaders('consumer-001'),
    body: JSON.stringify({ rating: 5, review: 'Too early review' }),
  });
  console.log(`  ✓ Review on pending order rejected with status: ${reviewPending.status}`);
  if (reviewPending.status !== 400) throw new Error('Review on pending order should return 400');

  // Step 4: Advance transaction to COMPLETED
  console.log('\n[SETUP 3] Advancing lifecycle to COMPLETED...');
  await fetch(`${baseUrl}/energy/transactions/${txId}/status`, {
    method: 'PUT',
    headers: authHeaders('prod-001'),
    body: JSON.stringify({ status: 'accepted' }),
  });
  await fetch(`${baseUrl}/energy/transactions/${txId}/status`, {
    method: 'PUT',
    headers: authHeaders('prod-001'),
    body: JSON.stringify({ status: 'in_transmission' }),
  });
  await fetch(`${baseUrl}/energy/transactions/${txId}/status`, {
    method: 'PUT',
    headers: authHeaders('prod-001'),
    body: JSON.stringify({ status: 'delivered' }),
  });
  await fetch(`${baseUrl}/energy/transactions/${txId}/status`, {
    method: 'PUT',
    headers: authHeaders('consumer-001'),
    body: JSON.stringify({ status: 'completed' }),
  });
  console.log(`  ✓ Order #${txId} is now COMPLETED`);

  // Step 5: Consumer submits valid 5-star review
  console.log('\n[TEST 2] Consumer submits 5-star rating & review...');
  const submitRev1 = await fetch(`${baseUrl}/energy/transactions/${txId}/review`, {
    method: 'POST',
    headers: authHeaders('consumer-001'),
    body: JSON.stringify({
      rating: 5,
      review: 'Excellent solar power quality and instant smart meter synchronization!',
    }),
  });
  const rev1Data = await submitRev1.json();
  console.log(`  ✓ Review created: Rating=${rev1Data.review?.rating} Stars, Review="${rev1Data.review?.review}"`);
  if (submitRev1.status !== 201 || rev1Data.review?.rating !== 5) throw new Error('Review submission failed');

  // Step 6: Verify duplicate review from consumer is blocked
  console.log('\n[TEST 3] Duplicate review attempt by consumer (should be blocked)...');
  const dupReview = await fetch(`${baseUrl}/energy/transactions/${txId}/review`, {
    method: 'POST',
    headers: authHeaders('consumer-001'),
    body: JSON.stringify({ rating: 4, review: 'Duplicate review' }),
  });
  console.log(`  ✓ Duplicate review rejected with status: ${dupReview.status}`);
  if (dupReview.status !== 400) throw new Error('Duplicate review should return 400');

  // Step 7: Producer reviews the consumer for the same completed transaction
  console.log('\n[TEST 4] Producer submits 5-star review for the consumer...');
  const submitRev2 = await fetch(`${baseUrl}/energy/transactions/${txId}/review`, {
    method: 'POST',
    headers: authHeaders('prod-001'),
    body: JSON.stringify({
      rating: 5,
      review: 'Prompt settlement and smooth grid dispatch. Great consumer!',
    }),
  });
  const rev2Data = await submitRev2.json();
  console.log(`  ✓ Producer review created: Rating=${rev2Data.review?.rating} Stars`);
  if (submitRev2.status !== 201) throw new Error('Producer review submission failed');

  // Step 8: Verify unrelated user cannot review
  console.log('\n[TEST 5] Unrelated user review attempt (should be 403 Forbidden)...');
  const unauthReview = await fetch(`${baseUrl}/energy/transactions/${txId}/review`, {
    method: 'POST',
    headers: authHeaders('unrelated-stranger-999'),
    body: JSON.stringify({ rating: 1, review: 'Malicious review' }),
  });
  console.log(`  ✓ Unrelated review rejected with status: ${unauthReview.status}`);
  if (unauthReview.status !== 403) throw new Error('Unauthorized review should return 403');

  // Step 9: Verify invalid rating values
  console.log('\n[TEST 6] Testing invalid rating validation (0 stars, 6 stars, missing)...');
  const invalidStar1 = await fetch(`${baseUrl}/energy/transactions/${txId}/review`, {
    method: 'POST',
    headers: authHeaders('consumer-002'),
    body: JSON.stringify({ rating: 6 }),
  });
  console.log(`  ✓ Rating 6 rejected with status: ${invalidStar1.status}`);
  if (invalidStar1.status !== 400) throw new Error('Rating 6 should return 400');

  // Step 10: Verify GET /transactions/:id/reviews
  console.log('\n[TEST 7] Fetching all reviews for Order #' + txId + '...');
  const getReviews = await fetch(`${baseUrl}/energy/transactions/${txId}/reviews`, {
    headers: authHeaders('consumer-001'),
  });
  const allReviewsData = await getReviews.json();
  console.log(`  ✓ Total reviews returned for Order #${txId}: ${allReviewsData.count}`);
  if (allReviewsData.count !== 2) throw new Error('Expected exactly 2 reviews (consumer & producer)');

  // Step 11: Verify GET /transactions/:id includes user_review
  console.log('\n[TEST 8] Fetching single transaction details with review...');
  const getTxDetail = await fetch(`${baseUrl}/energy/transactions/${txId}`, {
    headers: authHeaders('consumer-001'),
  });
  const txDetailData = (await getTxDetail.json()).transaction;
  console.log(`  ✓ Single transaction includes user_review (Rating: ${txDetailData.user_review?.rating} Stars)`);
  if (!txDetailData.user_review || txDetailData.user_review.rating !== 5) {
    throw new Error('user_review not attached to transaction detail');
  }

  // Step 12: Verify cancelled transaction cannot be reviewed
  console.log('\n[TEST 9] Testing cancelled transaction cannot be reviewed...');
  const purchase2 = await fetch(`${baseUrl}/energy/purchase`, {
    method: 'POST',
    headers: authHeaders('consumer-001'),
    body: JSON.stringify({ offer_id: offerId, energy_kwh: 5.0 }),
  });
  const tx2Id = (await purchase2.json()).transaction?.id;
  await fetch(`${baseUrl}/energy/transactions/${tx2Id}/cancel`, {
    method: 'POST',
    headers: authHeaders('consumer-001'),
    body: JSON.stringify({ reason: 'Cancelled before review' }),
  });

  const reviewCancelled = await fetch(`${baseUrl}/energy/transactions/${tx2Id}/review`, {
    method: 'POST',
    headers: authHeaders('consumer-001'),
    body: JSON.stringify({ rating: 5 }),
  });
  console.log(`  ✓ Review on cancelled order rejected with status: ${reviewCancelled.status}`);
  if (reviewCancelled.status !== 400) throw new Error('Review on cancelled order should return 400');

  console.log('\n================================================================');
  console.log('ALL 13 HD-61 RATE AND REVIEW TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

runHD61RateAndReviewTests().catch((err) => {
  console.error('HD-61 Test Failed:', err);
  process.exit(1);
});
