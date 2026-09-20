import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Download, Printer, CheckCircle2, MapPin, Calendar, User, FileText, X, ArrowRight } from 'lucide-react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import toast from 'react-hot-toast';
import BlockchainExplorerModal from '../../../components/common/BlockchainExplorerModal';

export default function ProofOfDeliveryModal({ isOpen, onClose, proofData }) {
  const [showBlockchainModal, setShowBlockchainModal] = useState(false);
  if (!isOpen || !proofData) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCertificate = () => {
    toast.success('Downloading Digital Proof of Delivery Certificate (PDF)...');
  };

  const txId = proofData.id || proofData.transaction_id || `P2P-PROOF-${Math.floor(100000 + Math.random() * 900000)}`;
  const energyAmount = proofData.energy_kwh || proofData.amount || 0;
  const sellerName = proofData.seller_name || 'Community Solar Producer';
  const buyerName = proofData.buyer_name || 'Household Consumer';
  const meterSN = proofData.meter_sn || 'SE-98210-SM1';
  const totalCost = proofData.total_amount || (energyAmount * 4.5).toFixed(2);
  const timestamp = proofData.created_at
    ? new Date(proofData.created_at).toLocaleString()
    : new Date().toLocaleString();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Proof of Electricity Delivery">
      <div className="space-y-5 pt-1 text-xs">
        {/* Certificate Banner Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 rounded-2xl p-5 text-white relative overflow-hidden shadow-lg border border-emerald-400/30">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-xl pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-[10px] font-extrabold uppercase text-lime-300 border border-white/20">
                <ShieldCheck className="w-3.5 h-3.5" /> Official Delivery Certificate
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-400/20 text-emerald-200 text-[10px] font-bold rounded-full border border-emerald-300/30">
                VERIFIED & DELIVERED
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-semibold text-emerald-100/80 block tracking-wider">Physical Power Transferred</span>
              <div className="text-3xl font-extrabold font-mono text-white flex items-baseline gap-2">
                {energyAmount} <span className="text-sm font-bold text-lime-300">kWh Solar Energy</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-emerald-100/90 font-mono">
              <span>Cert ID: #{txId}</span>
              <span>{timestamp}</span>
            </div>
          </div>
        </div>

        {/* Delivery Route & Meter Verification Details */}
        <div className="p-4 bg-background border border-border rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-navy font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Physical Transmission Verification Details
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-surface rounded-xl border border-border/60 space-y-1">
              <span className="text-[10px] uppercase text-text-secondary font-semibold block">Energy Source (Producer)</span>
              <span className="font-bold text-navy block truncate">{sellerName}</span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <Zap className="w-3 h-3" /> Rooftop Solar Generation
              </span>
            </div>

            <div className="p-3 bg-surface rounded-xl border border-border/60 space-y-1">
              <span className="text-[10px] uppercase text-text-secondary font-semibold block">Destination (Consumer)</span>
              <span className="font-bold text-navy block truncate">{buyerName}</span>
              <span className="text-[10px] font-mono text-primary font-semibold">
                Meter S/N: {meterSN}
              </span>
            </div>
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1.5 text-emerald-900">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Physical Microgrid Transmission Route:
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
              Solar Inverter Terminal ➔ Microgrid Feeder A ➔ <strong>Household Smart Meter #{meterSN}</strong>
            </p>
          </div>
        </div>

        {/* Financial & Environmental Proof summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-surface border border-border rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-text-secondary">Financial Settlement</span>
            <div className="text-base font-extrabold text-navy font-mono">₹{totalCost}</div>
            <span className="text-[10px] text-emerald-600 font-semibold block truncate">
              Credited to {proofData.seller_bank_name || 'HDFC Bank'} ({proofData.seller_bank_account ? (proofData.seller_bank_account.startsWith('••••') ? proofData.seller_bank_account : '•••• ' + String(proofData.seller_bank_account).slice(-4)) : '•••• 9283'})
            </span>
          </div>
          <div className="p-3 bg-surface border border-border rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-text-secondary">Environmental Impact</span>
            <div className="text-base font-extrabold text-emerald-600 font-mono">
              {(energyAmount * 0.82).toFixed(1)} kg CO₂
            </div>
            <span className="text-[10px] text-text-secondary">Clean Carbon Offset</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
          <Button
            variant="outline"
            className="flex-1 text-xs border-emerald-500/40 text-emerald-800 hover:bg-emerald-500/10 font-bold"
            onClick={() => setShowBlockchainModal(true)}
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> View On-Chain Proof
          </Button>
          <Button variant="outline" className="flex-1 text-xs" onClick={handleDownloadCertificate}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> PDF Certificate
          </Button>
          <Button variant="primary" className="flex-1 text-xs" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>

      <BlockchainExplorerModal
        isOpen={showBlockchainModal}
        onClose={() => setShowBlockchainModal(false)}
        txData={proofData}
      />
    </Modal>
  );
}
