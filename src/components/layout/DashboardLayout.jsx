import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from '../common/Sidebar';
import Navbar from '../common/Navbar';
import { EmailVerificationBanner } from '../../routes/ProtectedRoute';
import { useSidebar } from '../../hooks/useLocalStorage';
import { cn } from '../../utils/helpers';

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <Navbar onMenuClick={() => setMobileOpen(true)} />
      <EmailVerificationBanner />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'pt-16 min-h-screen transition-all duration-300',
          collapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'
        )}
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </motion.main>
    </div>
  );
}
