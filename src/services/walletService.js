import { recordClientAuditLog } from './auditService.js';

/* YUGA Energy Wallet & Settlement Service */

export const INITIAL_WALLET = {
  balance: 1500.0,
  todayEarnings: 0.0,
  monthlyEarnings: 1500.0,
  lifetimeEarnings: 4500.0,
  pendingSettlement: 0.0,
  escrowBalance: 0.0,
  currency: '₹',
  growthRate: 12.5,
};

export const INITIAL_PAYMENTS = [
  {
    id: 'PAY-98101',
    userId: 'guest',
    type: 'Solar Energy Sale',
    amount: 180.0,
    currency: '₹',
    status: 'Settled',
    paymentMethod: 'YUGA Blockchain Escrow (Razorpay)',
    date: new Date(Date.now() - 3600000 * 4).toISOString(),
    reference: 'SETTLE-98101',
    description: 'P2P solar transfer payout for 25.0 kWh.',
  },
];

const LOCAL_WALLET_KEY = 'hifai_registered_wallet_summary';
const LOCAL_PAYMENTS_KEY = 'hifai_registered_payments';

export function getLocalWallet(userId = 'guest') {
  try {
    const key = `${LOCAL_WALLET_KEY}_${userId || 'guest'}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
    return { id: userId, ...INITIAL_WALLET };
  } catch {
    return { id: userId, ...INITIAL_WALLET };
  }
}

export function saveLocalWallet(userId = 'guest', wallet) {
  try {
    const key = `${LOCAL_WALLET_KEY}_${userId || 'guest'}`;
    localStorage.setItem(key, JSON.stringify(wallet));
  } catch (e) {
    console.error('LocalStorage save wallet error:', e);
  }
}

function getLocalPayments(userId = 'guest') {
  try {
    const key = `${LOCAL_PAYMENTS_KEY}_${userId || 'guest'}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
    return INITIAL_PAYMENTS.map((p) => ({ ...p, userId }));
  } catch {
    return INITIAL_PAYMENTS.map((p) => ({ ...p, userId }));
  }
}

function saveLocalPayments(userId = 'guest', payments) {
  try {
    const key = `${LOCAL_PAYMENTS_KEY}_${userId || 'guest'}`;
    localStorage.setItem(key, JSON.stringify(payments));
  } catch (e) {
    console.error('LocalStorage save payments error:', e);
  }
}

export async function fetchWalletSummary(userId = 'guest') {
  return getLocalWallet(userId);
}

export async function fetchPaymentHistory(userId = 'guest') {
  return getLocalPayments(userId);
}

/**
 * Credits producer wallet upon Smart Meter Proof-of-Delivery
 */
export async function creditProducerWallet(userId = 'guest', amount, tradeDetails = {}) {
  const currentWallet = getLocalWallet(userId);
  const amt = parseFloat(amount || 0);
  if (amt <= 0) return currentWallet;

  const newBalance = parseFloat(((currentWallet.balance || 0) + amt).toFixed(2));
  const newToday = parseFloat(((currentWallet.todayEarnings || 0) + amt).toFixed(2));
  const newMonthly = parseFloat(((currentWallet.monthlyEarnings || 0) + amt).toFixed(2));
  const newLifetime = parseFloat(((currentWallet.lifetimeEarnings || 0) + amt).toFixed(2));

  const updatedWallet = {
    ...currentWallet,
    balance: newBalance,
    todayEarnings: newToday,
    monthlyEarnings: newMonthly,
    lifetimeEarnings: newLifetime,
    updatedAt: new Date().toISOString(),
  };

  saveLocalWallet(userId, updatedWallet);

  const paymentRecord = {
    id: `PAY-P2P-${Math.floor(10000 + Math.random() * 90000)}`,
    userId,
    type: 'Solar Energy Sale',
    amount: amt,
    currency: '₹',
    status: 'Settled',
    paymentMethod: 'Blockchain Escrow (Razorpay)',
    date: new Date().toISOString(),
    reference: tradeDetails.tradeId || `TX-P2P-${Date.now().toString().slice(-6)}`,
    description: `Clean energy revenue for ${tradeDetails.energyKwh || ''} kWh transferred to ${tradeDetails.buyerName || 'Consumer'}.`,
    metadata: tradeDetails,
  };

  const currentPayments = getLocalPayments(userId);
  saveLocalPayments(userId, [paymentRecord, ...currentPayments]);

  return updatedWallet;
}

/**
 * Producer Withdrawal / Settlement to Bank Account or UPI
 */
export async function withdrawProducerFunds(
  userId = 'guest',
  { amount, method = 'upi', upiId = '', accountNumber = '', ifsc = '', bankName = '', accountHolder = '' }
) {
  const currentWallet = getLocalWallet(userId);
  const requestedAmt = parseFloat(amount);

  if (isNaN(requestedAmt) || requestedAmt <= 0) {
    throw new Error('Please enter a valid withdrawal amount greater than ₹0.');
  }

  if (requestedAmt > (currentWallet.balance || 0)) {
    throw new Error(
      `Insufficient wallet balance! You requested ₹${requestedAmt.toFixed(2)}, but your available balance is ₹${(
        currentWallet.balance || 0
      ).toFixed(2)}.`
    );
  }

  const destinationDesc =
    method === 'upi' ? `UPI ID: ${upiId}` : `Bank: ${bankName || 'A/C'} (${accountNumber.slice(-4)}) IFSC: ${ifsc}`;

  const paymentData = {
    id: `WITHDRAW-${Math.floor(10000 + Math.random() * 90000)}`,
    userId,
    type: 'Bank Withdrawal Payout',
    amount: requestedAmt,
    currency: '₹',
    status: 'Completed',
    paymentMethod: method === 'upi' ? `UPI (${upiId})` : `NEFT/IMPS (${bankName})`,
    date: new Date().toISOString(),
    reference: `REF-BANK-${Date.now().toString().slice(-8)}`,
    description: `Withdrawn to ${destinationDesc}. Beneficiary: ${accountHolder || 'Registered Producer'}.`,
    metadata: { method, upiId, accountNumber: accountNumber ? `XXXX-${accountNumber.slice(-4)}` : '', ifsc, bankName },
  };

  const currentPayments = getLocalPayments(userId);
  saveLocalPayments(userId, [paymentData, ...currentPayments]);

  const newBalance = parseFloat(Math.max(0, (currentWallet.balance || 0) - requestedAmt).toFixed(2));
  const updatedWallet = {
    ...currentWallet,
    balance: newBalance,
    updatedAt: new Date().toISOString(),
  };
  saveLocalWallet(userId, updatedWallet);

  recordClientAuditLog({
    transaction_id: paymentData.id,
    actor: `${accountHolder || 'Producer'} (Withdrawal)`,
    action: 'PRODUCER_WITHDRAWAL',
    transaction_type: 'payout',
    amount: requestedAmt,
    status: 'verified',
    description: `Withdrew ₹${requestedAmt.toFixed(2)} from Energy Wallet to ${destinationDesc}. Reference: ${paymentData.reference}.`,
    metadata: paymentData,
  });

  return { success: true, paymentData, updatedWallet };
}

export async function requestSettlement(userId = 'guest', amount) {
  return withdrawProducerFunds(userId, { amount, method: 'upi', upiId: 'producer@okhdfcbank' });
}
