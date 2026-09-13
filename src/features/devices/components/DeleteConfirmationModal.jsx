import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import Button from '../../../components/common/Button';

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Item',
  message = 'Are you sure you want to delete this record? This action cannot be undone.',
  loading = false,
}) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          role="dialog"
          aria-modal="true"
          className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 text-center relative overflow-hidden"
        >
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-text-primary">{title}</h3>
            <p className="text-xs text-text-secondary leading-relaxed">{message}</p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-background border border-border rounded-xl text-xs font-semibold hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <Button
              type="button"
              variant="error"
              loading={loading}
              onClick={onConfirm}
              className="flex-1 text-xs"
            >
              <Trash2 className="w-4 h-4 mr-1 inline" /> Delete Permanently
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
