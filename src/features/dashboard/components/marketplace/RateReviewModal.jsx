import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Star,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { submitTransactionReview } from '../../../../services/marketplaceService';

const RATING_LABELS = {
  1: 'Very Poor',
  2: 'Poor',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
};

export default function RateReviewModal({
  transaction,
  isOpen,
  onClose,
  onReviewSubmitted,
}) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  if (!isOpen || !transaction) return null;

  const counterpartyName =
    transaction.seller_name ||
    transaction.seller ||
    transaction.buyer_name ||
    transaction.buyer ||
    'Counterparty';

  const activeStarCount = hoverRating || rating;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      toast.error('Please select a rating between 1 and 5 stars');
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      const res = await submitTransactionReview(transaction.id, {
        rating,
        review: reviewText.trim(),
      });

      setSubmittedData({
        rating,
        review: reviewText.trim(),
        orderId: transaction.id,
      });

      toast.success('Thank you! Review submitted successfully.');
      if (onReviewSubmitted) {
        onReviewSubmitted(res.review || { rating, review: reviewText.trim() });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishAndClose = () => {
    setSubmittedData(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 relative overflow-hidden"
        >
          {/* Top Amber Gradient Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600" />

          {!submittedData ? (
            /* ========================================================================= */
            /* FORM STATE                                                                */
            /* ========================================================================= */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-navy font-heading">
                      Rate Transaction
                    </h3>
                    <p className="text-xs text-text-secondary">
                      Order #{transaction.id} • {counterpartyName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-text-secondary hover:text-navy rounded-lg hover:bg-background transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Star Rating Selector */}
              <div className="p-4 bg-background rounded-xl border border-border text-center space-y-2">
                <p className="text-xs font-bold text-navy uppercase tracking-wider">
                  Rate your energy exchange experience
                </p>

                {/* 5-Star Interactive Row */}
                <div className="flex items-center justify-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isFilled = starVal <= activeStarCount;
                    return (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => setRating(starVal)}
                        onMouseEnter={() => setHoverRating(starVal)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                        title={`${starVal} Star - ${RATING_LABELS[starVal]}`}
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            isFilled
                              ? 'fill-amber-400 text-amber-500 drop-shadow-xs'
                              : 'text-gray-300 fill-transparent hover:text-amber-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Rating Label Indicator */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-700 rounded-full text-xs font-bold border border-amber-500/20">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{activeStarCount} / 5 Stars — {RATING_LABELS[activeStarCount] || 'Select rating'}</span>
                </div>
              </div>

              {/* Optional Text Review */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-navy flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-text-secondary" />
                    <span>Your Review (Optional)</span>
                  </label>
                  <span className="text-[11px] text-text-secondary">
                    {reviewText.length} / 500
                  </span>
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value.slice(0, 500))}
                  placeholder="Share details about transmission speed, meter verification, or producer communication..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-xs font-medium text-navy placeholder:text-text-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-background hover:bg-gray-100 border border-border rounded-xl text-xs font-bold text-navy transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || !rating}
                  className="flex-1 py-2.5 gradient-yuga text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:opacity-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Star className="w-3.5 h-3.5 fill-current" />
                  )}
                  <span>{submitting ? 'Submitting...' : 'Submit Review'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* ========================================================================= */
            /* SUCCESS CONFIRMATION STATE                                                */
            /* ========================================================================= */
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-navy font-heading">
                  Review Submitted
                </h3>
                <p className="text-xs text-text-secondary">
                  Your feedback for Order #{submittedData.orderId} has been recorded.
                </p>
              </div>

              {/* Submitted Review Summary Card */}
              <div className="p-3.5 bg-background rounded-xl border border-border text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-navy">Rating Given:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= submittedData.rating
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="font-bold text-xs text-navy ml-1 font-mono">
                      {submittedData.rating}.0
                    </span>
                  </div>
                </div>

                {submittedData.review && (
                  <div className="pt-1.5 border-t border-border/70 text-xs text-text-secondary italic bg-surface/50 p-2 rounded-lg">
                    &ldquo;{submittedData.review}&rdquo;
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFinishAndClose}
                  className="w-full py-2.5 gradient-yuga text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Done</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
