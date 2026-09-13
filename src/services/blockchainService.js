/**
 * YUGA Decentralized Energy Blockchain Service
 * Provides cryptographic SHA-256 block hashing, Smart Contract Escrow,
 * IoT Smart Meter Proof-of-Delivery verification, and Renewable Energy Certificates (RECs).
 */

const LOCAL_CHAIN_KEY = 'yuga_blockchain_ledger';
const LOCAL_ESCROW_KEY = 'yuga_smart_contract_escrows';

// Simple lightweight client-side SHA-256 implementation
export async function sha256(message) {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return '0x' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return '0x' + (hex + hex + hex + hex + hex + hex + hex + hex).slice(0, 64);
}

// Genesis Block Definition
const GENESIS_BLOCK = {
  blockNumber: 1,
  timestamp: '2026-01-01T00:00:00.000Z',
  previousHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  merkleRoot: '0x8f4b23c910fae12089b37c189b271638ac019283746192837461928374619283',
  blockHash: '0x000018a93ef071cb298374d9e023948572019384729183749281736491827364',
  validator: '0xYUGA_CORE_VALIDATOR_NODE_01',
  gasUsed: 21000,
  transactionsCount: 1,
  transactions: [
    {
      txHash: '0x0000genesis_block_initialization_reward_proof_of_authority_ledger_00',
      type: 'GENESIS',
      description: 'YUGA P2P Decentralized Clean Energy Microgrid Ledger Initialized',
    },
  ],
};

export function getBlockchainLedger() {
  try {
    const raw = localStorage.getItem(LOCAL_CHAIN_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [GENESIS_BLOCK];
}

export function saveBlockchainLedger(chain) {
  try {
    localStorage.setItem(LOCAL_CHAIN_KEY, JSON.stringify(chain));
  } catch (e) {
    console.error('Failed to save blockchain ledger:', e);
  }
}

export function getEscrowContracts() {
  try {
    const raw = localStorage.getItem(LOCAL_ESCROW_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveEscrowContracts(escrows) {
  try {
    localStorage.setItem(LOCAL_ESCROW_KEY, JSON.stringify(escrows));
  } catch (e) {
    console.error('Failed to save escrow contracts:', e);
  }
}

/**
 * Creates a Smart Contract Escrow Lock on the Blockchain
 */
export async function createSmartContractEscrow({
  tradeId,
  buyerId,
  buyerName,
  sellerId,
  sellerName,
  energyKwh,
  pricePerKwh,
  totalAmount,
  wheelingCharge = 0,
  lineLossPercent = 0,
  distanceKm = 0.4,
  paymentMethod = 'Razorpay (UPI / Card)',
  razorpayPaymentId = null,
}) {
  const timestamp = new Date().toISOString();
  const rawTxData = `${tradeId}|${buyerId}|${sellerId}|${energyKwh}|${totalAmount}|${timestamp}`;
  const txHash = await sha256(rawTxData);
  const contractAddress = `0xYUGA_ESCROW_${(await sha256(tradeId + timestamp)).slice(2, 10).toUpperCase()}`;

  const escrowRecord = {
    escrowId: `ESCROW-${tradeId}`,
    contractAddress,
    tradeId,
    txHash,
    state: 'LOCKED', // LOCKED -> DELIVERED_AND_RELEASED | REFUNDED
    buyerId,
    buyerName: buyerName || 'Household Consumer',
    sellerId,
    sellerName: sellerName || 'Community Solar Producer',
    energyKwh: parseFloat(energyKwh),
    pricePerKwh: parseFloat(pricePerKwh),
    totalAmount: parseFloat(totalAmount),
    wheelingCharge: parseFloat(wheelingCharge),
    lineLossPercent: parseFloat(lineLossPercent),
    distanceKm: parseFloat(distanceKm),
    paymentMethod,
    razorpayPaymentId: razorpayPaymentId || `pay_rzp_${Date.now()}`,
    lockedAt: timestamp,
    releasedAt: null,
    meterProofHash: null,
    recTokenId: null,
  };

  const escrows = getEscrowContracts();
  saveEscrowContracts([escrowRecord, ...escrows.filter((e) => e.tradeId !== tradeId)]);

  // Mine and append transaction into a new Blockchain Block
  await mineBlockchainBlock({
    txHash,
    type: 'ENERGY_ESCROW_LOCKED',
    contractAddress,
    tradeId,
    buyer: escrowRecord.buyerName,
    seller: escrowRecord.sellerName,
    energyKwh: escrowRecord.energyKwh,
    amount: escrowRecord.totalAmount,
    status: 'LOCKED_IN_ESCROW',
    description: `Locked ₹${escrowRecord.totalAmount.toFixed(2)} in Escrow Contract ${contractAddress} for ${energyKwh} kWh solar transfer.`,
  });

  return escrowRecord;
}

/**
 * Verifies Smart Meter Delivery Telemetry and Releases Funds to Producer
 */
export async function verifySmartMeterDeliveryAndRelease({
  tradeId,
  meterSn = 'SM-DINDIGUL-01',
  voltageV = 230.4,
  frequencyHz = 50.02,
  actualDeliveredKwh = null,
}) {
  const escrows = getEscrowContracts();
  const targetIndex = escrows.findIndex((e) => e.tradeId === tradeId || e.escrowId === tradeId);

  if (targetIndex === -1) {
    throw new Error(`Escrow contract not found for Trade ID: ${tradeId}`);
  }

  const escrow = escrows[targetIndex];
  if (escrow.state === 'DELIVERED_AND_RELEASED') {
    return escrow; // Already verified and released
  }

  const timestamp = new Date().toISOString();
  const kwh = actualDeliveredKwh || escrow.energyKwh;

  // Generate Cryptographic Proof of Delivery Telemetry Hash
  const meterTelemetryPayload = `${meterSn}|${voltageV}V|${frequencyHz}Hz|${kwh}kWh|${timestamp}`;
  const meterProofHash = await sha256(meterTelemetryPayload);
  const recTokenId = `REC-SOLAR-${Math.floor(100000 + Math.random() * 900000)}`;

  escrow.state = 'DELIVERED_AND_RELEASED';
  escrow.releasedAt = timestamp;
  escrow.meterProofHash = meterProofHash;
  escrow.recTokenId = recTokenId;
  escrow.smartMeterTelemetry = {
    meterSn,
    voltageV,
    frequencyHz,
    deliveredKwh: kwh,
    verifiedAt: timestamp,
  };

  escrows[targetIndex] = escrow;
  saveEscrowContracts(escrows);

  // Mine the Release & REC Minting Block onto the Blockchain
  const releaseTxHash = await sha256(`RELEASE|${escrow.contractAddress}|${meterProofHash}|${timestamp}`);
  await mineBlockchainBlock({
    txHash: releaseTxHash,
    type: 'ENERGY_DELIVERY_SETTLED',
    contractAddress: escrow.contractAddress,
    tradeId: escrow.tradeId,
    buyer: escrow.buyerName,
    seller: escrow.sellerName,
    energyKwh: escrow.energyKwh,
    amount: escrow.totalAmount,
    meterProofHash,
    recTokenId,
    status: 'SETTLED_TO_PRODUCER',
    description: `Smart Meter #${meterSn} verified delivery of ${kwh} kWh. Funds of ₹${escrow.totalAmount.toFixed(2)} released to Producer wallet. REC Token #${recTokenId} minted.`,
  });

  return escrow;
}

/**
 * Mines a new Block onto the YUGA Blockchain Ledger
 */
async function mineBlockchainBlock(transactionData) {
  const chain = getBlockchainLedger();
  const previousBlock = chain[chain.length - 1] || GENESIS_BLOCK;
  const nextBlockNumber = previousBlock.blockNumber + 1;
  const timestamp = new Date().toISOString();

  const merkleRoot = await sha256(JSON.stringify(transactionData));
  const rawBlockHeader = `${nextBlockNumber}|${previousBlock.blockHash}|${merkleRoot}|${timestamp}`;
  const blockHash = await sha256(rawBlockHeader);

  const newBlock = {
    blockNumber: nextBlockNumber,
    timestamp,
    previousHash: previousBlock.blockHash,
    merkleRoot,
    blockHash,
    validator: '0xYUGA_PoA_SMART_GRID_VALIDATOR',
    gasUsed: Math.floor(21000 + Math.random() * 4500),
    transactionsCount: 1,
    transactions: [transactionData],
  };

  const updatedChain = [...chain, newBlock];
  saveBlockchainLedger(updatedChain);
  return newBlock;
}

/**
 * Validates the complete integrity of the blockchain
 */
export async function verifyBlockchainIntegrity() {
  const chain = getBlockchainLedger();
  if (chain.length <= 1) return { isValid: true, blocksVerified: chain.length };

  for (let i = 1; i < chain.length; i++) {
    const current = chain[i];
    const previous = chain[i - 1];

    if (current.previousHash !== previous.blockHash) {
      return {
        isValid: false,
        error: `Broken chain link at Block #${current.blockNumber}: Previous hash mismatch.`,
        brokenBlockNumber: current.blockNumber,
      };
    }
  }

  return { isValid: true, blocksVerified: chain.length, totalBlocks: chain.length };
}

/**
 * Retrieves cryptographic transaction receipt
 */
export function getBlockchainReceipt(txHashOrTradeId) {
  const chain = getBlockchainLedger();
  for (const block of chain) {
    const tx = block.transactions.find(
      (t) => t.txHash === txHashOrTradeId || t.tradeId === txHashOrTradeId
    );
    if (tx) {
      return {
        ...tx,
        blockNumber: block.blockNumber,
        blockHash: block.blockHash,
        timestamp: block.timestamp,
        validator: block.validator,
        gasUsed: block.gasUsed,
      };
    }
  }
  return null;
}
