import { motion } from 'framer-motion';
import Logo from '../../../components/common/Logo';
import PhoneLoginForm from '../components/PhoneLoginForm';
import { ROUTES } from '../../../utils/constants';

export default function PhoneLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-surface rounded-[var(--radius-card)] border border-border shadow-[var(--shadow-card)] p-8 space-y-6">
          <div className="text-center space-y-2">
            <Logo size="md" linkTo={ROUTES.LOGIN} className="justify-center" />
            <h1 className="text-xl font-bold text-text-primary pt-2">Phone Authentication</h1>
            <p className="text-sm text-text-secondary">
              Sign in to your YUGA REOS account using SMS OTP verification
            </p>
          </div>

          <PhoneLoginForm />
        </div>
      </motion.div>
    </div>
  );
}
