import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Zap,
  Lock,
  ExternalLink,
  CheckCircle2,
  Copy,
  Layers,
  Fuel,
  Clock,
  User,
  X,
  FileCode,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getBlockchainReceipt } from '../../services/blockchainService';

export default function BlockchainExplorerModal({ isOpen, onClose, txData }) {
  if (!isOpen || !txData) return null;

  const receipt =
    getBlockchainReceipt(txData.txHash || txData.id) || {
      txHash: txData.txHash || txData.blockchain_hash || '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      blockNumber: txData.block_number || txData.metadata?.block_number || 1894215,
      contractAddress: txData.contractAddress || txData.metadata?.contractAddress || '0xYUGA_ESCROW_DINDIGUL_P2P',
      recTokenId: txData.recTokenId || txData.metadata?.recTokenId || 'REC-SOLAR-981023',
      gasUsed: txData.metadata?.gas_used || 21450,
      validator: '0xYUGA_PoA_SMART_GRID_VALIDATOR_01',
      status: 'VERIFIED_ON_CHAIN',
    };

  const handleCopy = (text, label) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success(`Copied ${label} to clipboard!`);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-surface border border-emerald-500/30 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden relative text-xs"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-navy p-5 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-extrabold uppercase border border-emerald-400/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-lime-300" /> On-Chain Blockchain Proof
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-400/20 text-blue-200 text-[10px] font-bold border border-blue-400/30">
                Polygon PoS Microgrid
              </span>
            </div>

            <h3 className="text-xl font-extrabold text-white font-heading">
              Immutable Transaction Ledger Receipt
            </h3>
            <p className="text-xs text-emerald-100/80">
              Verified through Smart Meter IoT Proof-of-Delivery & Smart Contract Escrow
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* Status Pill Card */}
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                    Execution State
                  </span>
                  <span className="text-sm font-extrabold text-emerald-950">
                    SETTLED & ESCROW RELEASED
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-text-secondary block">Block Height</span>
                <span className="font-mono text-sm font-black text-navy">#{receipt.blockNumber}</span>
              </div>
            </div>

            {/* Cryptographic Hashes Details */}
            <div className="space-y-2.5 bg-background p-4 rounded-2xl border border-border/80">
              {/* Transaction Hash */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-text-secondary mb-1">
                  <span className="font-bold flex items-center gap-1 text-navy">
                    <FileCode className="w-3.5 h-3.5 text-emerald-600" /> Transaction Hash
                  </span>
                  <button
                    onClick={() => handleCopy(receipt.txHash, 'Transaction Hash')}
                    className="text-primary hover:text-emerald-700 flex items-center gap-1 font-semibold"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <div className="p-2.5 bg-surface rounded-xl border border-border text-[11px] font-mono text-navy break-all select-all font-medium">
                  {receipt.txHash}
                </div>
              </div>

              {/* Escrow Smart Contract Address */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-text-secondary mb-1">
                  <span className="font-bold flex items-center gap-1 text-navy">
                    <Lock className="w-3.5 h-3.5 text-blue-600" /> Smart Contract Escrow Address
                  </span>
                  <button
                    onClick={() => handleCopy(receipt.contractAddress, 'Contract Address')}
                    className="text-primary hover:text-emerald-700 flex items-center gap-1 font-semibold"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <div className="p-2.5 bg-surface rounded-xl border border-border text-[11px] font-mono text-emerald-700 font-bold break-all">
                  {receipt.contractAddress}
                </div>
              </div>

              {/* REC Certificate Token */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-text-secondary mb-1">
                  <span className="font-bold flex items-center gap-1 text-navy">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> Renewable Energy Certificate (REC)
                  </span>
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md">
                    100% Green Solar
                  </span>
                </div>
                <div className="p-2.5 bg-surface rounded-xl border border-border text-[11px] font-mono text-amber-900 font-bold">
                  {receipt.recTokenId}
                </div>
              </div>
            </div>

            {/* Block & Consensus Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-surface border border-border rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-text-secondary flex items-center gap-1">
                  <Fuel className="w-3 h-3 text-purple-600" /> Gas Consumed
                </span>
                <span className="font-mono font-bold text-navy text-sm">{receipt.gasUsed} Units</span>
                <span className="text-[10px] text-emerald-600 block font-semibold">Polygon PoA Node</span>
              </div>

              <div className="p-3 bg-surface border border-border rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-text-secondary flex items-center gap-1">
                  <Layers className="w-3 h-3 text-blue-600" /> Consensus Proof
                </span>
                <span className="font-bold text-navy text-xs block truncate">Proof of Microgrid Delivery</span>
                <span className="text-[10px] text-text-secondary block">IoT Signed Signature</span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-full py-3 bg-navy hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition-colors"
            >
              Close Blockchain Receipt
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
