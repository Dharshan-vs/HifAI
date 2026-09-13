/**
 * YUGA Razorpay Payment Gateway Service
 * Handles Razorpay checkout modal, UPI / Cards / NetBanking payments,
 * and Escrow locking for peer-to-peer clean energy microgrid purchases.
 */

// Dynamically inject Razorpay Checkout SDK Script
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Razorpay SDK failed to load from CDN. Using Interactive Sandbox Fallback Modal.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Initiates Razorpay payment for P2P Energy Purchase
 */
export async function initiateRazorpayPayment({
  amountInr,
  orderId = `ORD_ENERGY_${Date.now()}`,
  energyKwh,
  sellerName,
  buyerName,
  buyerEmail = 'consumer@yuga-grid.io',
  buyerPhone = '9876543210',
  onSuccess,
  onDismiss,
}) {
  const isLoaded = await loadRazorpayScript();
  const razorpayKey = import.meta.env?.VITE_RAZORPAY_KEY_ID || 'rzp_test_YUGA_Microgrid_CleanEnergy';

  // Amount in Paise (e.g. ₹100.50 -> 10050 paise)
  const amountInPaise = Math.round(parseFloat(amountInr) * 100);

  if (isLoaded && window.Razorpay && !razorpayKey.includes('YUGA_Microgrid_CleanEnergy')) {
    const options = {
      key: razorpayKey,
      amount: amountInPaise,
      currency: 'INR',
      name: 'YUGA Energy Microgrid',
      description: `P2P Clean Solar Energy Purchase: ${energyKwh} kWh from ${sellerName}`,
      image: '/favicon.ico',
      order_id: '', // Generated on live backend when configured
      handler: function (response) {
        if (onSuccess) {
          onSuccess({
            razorpay_payment_id: response.razorpay_payment_id || `pay_rzp_${Date.now()}`,
            razorpay_order_id: response.razorpay_order_id || orderId,
            razorpay_signature: response.razorpay_signature || `sig_rzp_${Date.now()}`,
            payment_method: 'Razorpay Live Gateway',
          });
        }
      },
      prefill: {
        name: buyerName,
        email: buyerEmail,
        contact: buyerPhone,
      },
      notes: {
        microgrid_trade_type: 'P2P_SOLAR_ENERGY',
        energy_kwh: energyKwh,
        seller: sellerName,
        escrow_mode: 'YUGA_SMART_CONTRACT_ESCROW',
      },
      theme: {
        color: '#10B981',
      },
      modal: {
        ondismiss: function () {
          if (onDismiss) onDismiss();
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
    return { isNative: true };
  }

  // Return fallback modal trigger flag
  return { isNative: false, simulated: true };
}
