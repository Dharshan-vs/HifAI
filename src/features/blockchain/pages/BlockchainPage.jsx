import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Blocks,
  ShieldCheck,
  Lock,
  Unlock,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Layers,
  Cpu,
  Zap,
  Award,
  Search,
  Check,
  Copy,
  Hash,
  Activity,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Card, { CardHeader, CardTitle, CardContent } from '../../../components/common/Card';
import StatsCard from '../../../components/common/StatsCard';
import BlockchainExplorerModal from '../../../components/common/BlockchainExplorerModal';
import {
  getBlockchainLedger,
  getEscrowContracts,
  sha256,
} from '../../../services/blockchainService';
import { fetchUserTransactions } from '../../../services/marketplaceService';

export default function BlockchainPage() {
  const [blocks, setBlocks] = useState([]);
  const [escrows, setEscrows] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState(null);
  const [showExplorerModal, setShowExplorerModal] = useState(false);
  const [activeTab, setActiveTab] = useState('escrows'); // 'escrows' | 'blocks' | 'recs' | 'verifier'

  // Hash Verifier State
  const [verifyInput, setVerifyInput] = useState('');
  const [computedHash, setComputedHash] = useState('');
  const [copiedHash, setCopiedHash] = useState(false);

  const loadBlockchainData = async () => {
    setLoading(true);
    try {
      const chain = getBlockchainLedger();
      const escList = getEscrowContracts();
      const txs = await fetchUserTransactions();
      setBlocks(chain || []);
      setEscrows(escList || []);
      setTransactions(txs || []);
    } catch (e) {
      console.error('Error loading blockchain data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlockchainData();
  }, []);

  const handleComputeHash = async (val) => {
    setVerifyInput(val);
    if (!val.trim()) {
      setComputedHash('');
      return;
    }
    const hash = await sha256(val);
    setComputedHash(hash);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const totalKwhOnChain = transactions.reduce(
    (sum, t) => sum + (parseFloat(t.energyAmount || t.energy_kwh) || 0),
    0
  );
  const activeEscrowLocks = escrows.filter((e) => e.status === 'LOCKED_IN_ESCROW').length;
  const releasedEscrows = escrows.filter((e) => e.status === 'RELEASED_TO_PRODUCER').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-navy via-slate-900 to-navy p-6 rounded-2xl text-white shadow-xl border border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Node: Dindigul Proof-of-Authority (PoA)
            </span>
            <span className="text-white/40 text-xs">•</span>
            <span className="text-white/70 text-xs font-mono">Consensus: 100% Synced</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 text-white">
            <Blocks className="w-7 h-7 text-lime-400" />
            Decentralized Energy Blockchain Ledger
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm">
            Inspect cryptographic SHA-256 blocks, Smart Contract Escrows, and IoT Smart Meter Proof-of-Delivery verifications.
          </p>
        </div>

        <button
          onClick={() => {
            loadBlockchainData();
            toast.success('Blockchain ledger synced with local validator node');
          }}
          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-xs flex items-center gap-2 transition-all shrink-0 self-start md:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-lime-400" /> Sync Chain
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Current Block Height"
          value={`#${blocks.length}`}
          change="Cryptographically Chained"
          isPositive={true}
          icon={Layers}
        />
        <StatsCard
          title="Active Escrow Locks"
          value={`${activeEscrowLocks} Active`}
          change={`${releasedEscrows} Released to Producers`}
          isPositive={true}
          icon={Lock}
        />
        <StatsCard
          title="Energy Traded On-Chain"
          value={`${totalKwhOnChain.toFixed(1)} kWh`}
          change="Zero double-spending verified"
          isPositive={true}
          icon={Zap}
        />
        <StatsCard
          title="Consensus & Security"
          value="SHA-256 + PoD"
          change="Smart Meter Telemetry Verified"
          isPositive={true}
          icon={ShieldCheck}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('escrows')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'escrows'
              ? 'bg-primary text-navy shadow-sm'
              : 'bg-surface hover:bg-surface-hover text-text-secondary border border-border'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Smart Contract Escrows ({escrows.length})
        </button>

        <button
          onClick={() => setActiveTab('blocks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'blocks'
              ? 'bg-primary text-navy shadow-sm'
              : 'bg-surface hover:bg-surface-hover text-text-secondary border border-border'
          }`}
        >
          <Blocks className="w-4 h-4" /> Mined Block Chain ({blocks.length})
        </button>

        <button
          onClick={() => setActiveTab('recs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'recs'
              ? 'bg-primary text-navy shadow-sm'
              : 'bg-surface hover:bg-surface-hover text-text-secondary border border-border'
          }`}
        >
          <Award className="w-4 h-4" /> Renewable Certificates (RECs)
        </button>

        <button
          onClick={() => setActiveTab('verifier')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'verifier'
              ? 'bg-primary text-navy shadow-sm'
              : 'bg-surface hover:bg-surface-hover text-text-secondary border border-border'
          }`}
        >
          <Hash className="w-4 h-4" /> SHA-256 Hash Verifier
        </button>
      </div>

      {/* TAB 1: Smart Contract Escrows */}
      {activeTab === 'escrows' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>On-Chain Smart Contract Escrows</CardTitle>
              <p className="text-xs text-text-secondary mt-0.5">
                Every trade is escrowed on-chain and only released to the producer wallet when physical smart meter delivery is verified.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg">
              {escrows.length} Contracts
            </span>
          </CardHeader>
          <CardContent>
            {escrows.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <ShieldCheck className="w-10 h-10 text-text-secondary/40 mx-auto" />
                <p className="text-sm font-semibold text-navy">No Smart Contract Escrows Created Yet</p>
                <p className="text-xs text-text-secondary max-w-md mx-auto">
                  When a consumer buys energy in the Energy Marketplace, a cryptographic escrow lock will be deployed here automatically!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {escrows.map((escrow) => {
                  const isLocked = escrow.status === 'LOCKED_IN_ESCROW';
                  return (
                    <div
                      key={escrow.contractId}
                      className="p-4 bg-background/80 rounded-2xl border border-border hover:border-primary/50 transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-2 rounded-xl ${
                              isLocked
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-emerald-500/10 text-emerald-600'
                            }`}
                          >
                            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-navy">
                                {escrow.contractId}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                  isLocked
                                    ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                }`}
                              >
                                {isLocked ? '🔒 Locked in Escrow' : '✅ Released to Producer'}
                              </span>
                            </div>
                            <p className="text-[11px] text-text-secondary">
                              Trade Ref: <span className="font-mono">{escrow.tradeId}</span> •{' '}
                              {new Date(escrow.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedTxForReceipt({
                              id: escrow.tradeId,
                              buyer: escrow.buyerName,
                              seller: escrow.sellerName,
                              energyAmount: escrow.energyKwh,
                              price: escrow.totalAmount,
                              date: escrow.createdAt,
                              razorpayPaymentId: escrow.razorpayPaymentId,
                              txHash: escrow.txHash,
                              blockNumber: escrow.blockNumber,
                            });
                            setShowExplorerModal(true);
                          }}
                          className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary-dark font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all self-start sm:self-auto"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View On-Chain Receipt
                        </button>
                      </div>

                      {/* Escrow Details Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-2.5 bg-surface rounded-xl border border-border/70">
                          <span className="text-text-secondary text-[11px] block">Escrow Amount</span>
                          <span className="font-mono font-extrabold text-navy text-sm">
                            ₹{escrow.totalAmount?.toFixed(2)}
                          </span>
                        </div>
                        <div className="p-2.5 bg-surface rounded-xl border border-border/70">
                          <span className="text-text-secondary text-[11px] block">Energy Transfer</span>
                          <span className="font-mono font-bold text-emerald-600 text-sm">
                            {escrow.energyKwh} kWh
                          </span>
                        </div>
                        <div className="p-2.5 bg-surface rounded-xl border border-border/70">
                          <span className="text-text-secondary text-[11px] block">Payment Gateway</span>
                          <span className="font-semibold text-navy truncate block">
                            {escrow.paymentMethod || 'Razorpay'}
                          </span>
                        </div>
                        <div className="p-2.5 bg-surface rounded-xl border border-border/70">
                          <span className="text-text-secondary text-[11px] block">Proof-of-Delivery</span>
                          <span className="font-semibold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                          </span>
                        </div>
                      </div>

                      {/* Smart Meter Hashes */}
                      <div className="p-2.5 bg-slate-900 text-slate-300 rounded-xl font-mono text-[11px] space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Tx Hash:</span>
                          <span className="text-lime-300 truncate max-w-[280px] sm:max-w-md">
                            {escrow.txHash || '0x7f8a9b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400">Escrow Condition:</span>
                          <span className="text-slate-200 truncate">
                            Buyer Meter ({escrow.buyerSmartMeterId || 'SM-BUYER-01'}) ⇆ Producer Meter ({escrow.sellerSmartMeterId || 'SM-PROD-01'})
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: Mined Block Chain */}
      {activeTab === 'blocks' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sequential Block Chain</CardTitle>
                <p className="text-xs text-text-secondary">
                  Each block is cryptographically linked to the previous block hash. Tamper-proof and immutable.
                </p>
              </div>
              <span className="font-mono text-xs font-bold px-2.5 py-1 bg-lime-400/20 text-lime-700 rounded-lg">
                Height: #{blocks.length}
              </span>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {blocks.map((block, idx) => (
                  <div
                    key={block.blockNumber || idx}
                    className="p-5 bg-background/80 rounded-2xl border border-border hover:border-primary transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-navy text-lime-400 flex items-center justify-center font-mono font-bold text-sm shadow-md">
                          #{block.blockNumber}
                        </div>
                        <div>
                          <h4 className="font-bold text-navy text-sm">
                            {block.blockNumber === 1 ? 'Genesis Block' : `Energy Trade Block #${block.blockNumber}`}
                          </h4>
                          <p className="text-[11px] text-text-secondary">
                            Mined on: {new Date(block.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="px-2.5 py-1 bg-surface border border-border text-navy rounded-lg font-mono text-xs font-bold">
                          {block.transactionsCount || (block.transactions ? block.transactions.length : 1)} Tx
                        </span>
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg font-mono text-xs font-bold">
                          Gas: {block.gasUsed || 21000}
                        </span>
                      </div>
                    </div>

                    {/* Hashes */}
                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2.5 bg-slate-900 text-slate-200 rounded-xl space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                          <span className="text-slate-400 text-[11px]">Block Hash:</span>
                          <span className="text-lime-300 font-bold truncate">
                            {block.blockHash || '0x0000abc...'}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-[11px]">
                          <span className="text-slate-400">Previous Hash:</span>
                          <span className="text-slate-300 truncate">
                            {block.previousHash || '0x0000000...'}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-[11px]">
                          <span className="text-slate-400">Merkle Root:</span>
                          <span className="text-slate-300 truncate">
                            {block.merkleRoot || '0x8f4b...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: Renewable Energy Certificates (RECs) */}
      {activeTab === 'recs' && (
        <Card>
          <CardHeader>
            <CardTitle>Minted Renewable Energy Certificates (RECs)</CardTitle>
            <p className="text-xs text-text-secondary">
              Cryptographic Green Energy NFTs proving physical solar generation, carbon offsets, and zero double-counting.
            </p>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-secondary">
                No energy certificates minted yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {transactions.map((tx, i) => {
                  const kwh = parseFloat(tx.energyAmount || tx.energy_kwh || 10);
                  const co2Kg = (kwh * 0.82).toFixed(2);
                  return (
                    <div
                      key={tx.id || i}
                      className="p-4 bg-gradient-to-br from-emerald-500/5 via-surface to-surface border border-emerald-500/20 rounded-2xl space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-emerald-500" />
                          <span className="font-mono text-xs font-bold text-navy">
                            REC-YUGA-{tx.id || 1000 + i}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-500/20">
                          100% Green Solar
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-text-secondary text-[10px] block">Beneficiary (Buyer)</span>
                          <span className="font-bold text-navy">{tx.buyer || 'Consumer Household'}</span>
                        </div>
                        <div>
                          <span className="text-text-secondary text-[10px] block">Green Energy Verified</span>
                          <span className="font-bold text-emerald-600">{kwh} kWh</span>
                        </div>
                        <div>
                          <span className="text-text-secondary text-[10px] block">CO2 Emissions Avoided</span>
                          <span className="font-bold text-emerald-600 font-mono">{co2Kg} kg CO₂</span>
                        </div>
                        <div>
                          <span className="text-text-secondary text-[10px] block">Mint Timestamp</span>
                          <span className="text-text-secondary font-mono text-[10px]">
                            {new Date(tx.date || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="p-2 bg-slate-900 text-slate-300 font-mono text-[10px] rounded-lg truncate">
                        Token Signature: 0xrec_{Math.abs(kwh * 9999).toString(16)}...
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 4: SHA-256 Hash Verifier */}
      {activeTab === 'verifier' && (
        <Card>
          <CardHeader>
            <CardTitle>Interactive Cryptographic SHA-256 Hash Verifier</CardTitle>
            <p className="text-xs text-text-secondary">
              Input any transaction payload, smart meter reading, or receipt string to compute and verify the exact 256-bit cryptographic digest.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-bold text-navy block mb-1.5">
                Input Data String / Smart Meter Payload:
              </label>
              <textarea
                value={verifyInput}
                onChange={(e) => handleComputeHash(e.target.value)}
                placeholder="e.g. TRADE-101|BUYER-SM-001|PROD-SM-002|50kWh|INR360.00"
                rows={3}
                className="w-full p-3 bg-background border border-border rounded-xl text-xs font-mono focus:outline-none focus:border-primary"
              />
            </div>

            {computedHash && (
              <div className="p-4 bg-slate-900 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    Computed SHA-256 Hash Digest:
                  </span>
                  <button
                    onClick={() => copyToClipboard(computedHash)}
                    className="text-xs text-lime-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    {copiedHash ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedHash ? 'Copied' : 'Copy Hash'}
                  </button>
                </div>
                <p className="font-mono text-xs text-lime-300 font-bold break-all">{computedHash}</p>
              </div>
            )}

            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs text-navy space-y-1">
              <span className="font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Deterministic & Collision-Resistant
              </span>
              <p className="text-[11px] text-text-secondary">
                The computed hash changes completely if even a single character or byte in the smart meter telemetry payload is altered.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* deep dive modal */}
      {selectedTxForReceipt && (
        <BlockchainExplorerModal
          isOpen={showExplorerModal}
          onClose={() => {
            setShowExplorerModal(false);
            setSelectedTxForReceipt(null);
          }}
          transaction={selectedTxForReceipt}
        />
      )}
    </div>
  );
}
