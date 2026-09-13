import { Check, X } from 'lucide-react';

export default function PasswordStrengthMeter({ password = '' }) {
  const requirements = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'Contains uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
    { label: 'Contains lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
    { label: 'Contains number (0-9)', test: (p) => /\d/.test(p) },
    { label: 'Contains special character (!@#$%^&*)', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
  ];

  const passedCount = requirements.filter((r) => r.test(password)).length;
  
  const getStrengthLabel = () => {
    if (!password) return { text: 'Enter password', color: 'bg-gray-200', textClass: 'text-text-secondary', percent: 0 };
    if (passedCount <= 2) return { text: 'Weak', color: 'bg-rose-500', textClass: 'text-rose-500', percent: 25 };
    if (passedCount === 3) return { text: 'Fair', color: 'bg-amber-500', textClass: 'text-amber-500', percent: 50 };
    if (passedCount === 4) return { text: 'Good', color: 'bg-blue-500', textClass: 'text-blue-500', percent: 75 };
    return { text: 'Strong', color: 'bg-emerald-500', textClass: 'text-emerald-600', percent: 100 };
  };

  const strength = getStrengthLabel();

  return (
    <div className="space-y-3 pt-1">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-text-secondary">Password Strength</span>
          <span className={strength.textClass}>{strength.text}</span>
        </div>
        <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border">
          <div
            className={`h-full transition-all duration-300 ${strength.color}`}
            style={{ width: `${strength.percent}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
        {requirements.map((req, idx) => {
          const met = req.test(password);
          return (
            <div
              key={idx}
              className={`flex items-center gap-1.5 font-medium transition-colors ${
                met ? 'text-emerald-600' : 'text-text-secondary'
              }`}
            >
              {met ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              )}
              <span>{req.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
