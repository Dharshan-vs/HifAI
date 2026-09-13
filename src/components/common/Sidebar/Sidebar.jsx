import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Cpu,
  Zap,
  Activity,
  ShoppingBag,
  FileText,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  HardDrive,
  Gauge,
  Sun,
  Battery,
  RefreshCw,
  Wifi,
  ChevronDown,
  ShieldCheck,
  Blocks,
} from 'lucide-react';
import Logo from '../Logo';
import { useAuth } from '../../../context/AuthContext';
import { useSidebar } from '../../../hooks/useLocalStorage';
import { cn } from '../../../utils/helpers';
import { ROUTES } from '../../../utils/constants';
import toast from 'react-hot-toast';

import { getRoleDashboardRoute } from '../../../routes/ProtectedRoute';

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const { collapsed, toggle } = useSidebar();
  const { logout, userProfile } = useAuth();
  const navigate = useNavigate();

  const [devicesOpen, setDevicesOpen] = useState(true);

  const roleDashboard = getRoleDashboardRoute(userProfile?.role);

  const isAdmin = userProfile?.role === 'admin';
  const isConsumer = !userProfile?.role || userProfile?.role === 'consumer';
  const isProducer = userProfile?.role === 'producer';

  const mainNavItems = isAdmin
    ? [
        { to: ROUTES.AUDIT_TRAIL, icon: ShieldCheck, label: 'Audit Trail (Admin)' },
        { to: ROUTES.MARKETPLACE, icon: ShoppingBag, label: 'Energy Marketplace' },
        { to: ROUTES.REPORTS, icon: FileText, label: 'Reports' },
        { to: ROUTES.SYSTEMS, icon: Cpu, label: 'Energy Systems' },
      ]
    : [
        { to: roleDashboard, icon: LayoutDashboard, label: 'Dashboard' },
        { to: ROUTES.MARKETPLACE, icon: ShoppingBag, label: 'Energy Marketplace' },
        ...(!isConsumer ? [{ to: ROUTES.SYSTEMS, icon: Cpu, label: 'Energy Systems' }] : []),
        ...(!isConsumer ? [{ to: ROUTES.GENERATION, icon: Zap, label: 'Generation' }] : []),
        ...(isConsumer ? [{ to: ROUTES.CONSUMPTION, icon: Activity, label: 'Consumption' }] : []),
        { to: ROUTES.REPORTS, icon: FileText, label: 'Reports' },
      ];

  const deviceSubItems = [
    { to: ROUTES.DEVICES_SMART_METER, icon: Gauge, label: 'Smart Meter' },
    { to: ROUTES.DEVICES_BATTERY, icon: Battery, label: 'Battery Management' },
  ];

  const bottomNavItems = [
    { to: ROUTES.PROFILE, icon: User, label: 'Profile' },
    { to: ROUTES.SETTINGS, icon: Settings, label: 'Settings' },
  ];

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      toast.success('Signed out successfully');
      navigate(ROUTES.LOGIN);
    } else {
      toast.error(result.error);
    }
  };

  const sidebarContent = (
    <>
      <div className={cn('flex items-center px-4 py-5 border-b border-border', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && <Logo size="sm" linkTo={ROUTES.DASHBOARD} />}
        {collapsed && (
          <Logo size="sm" showText={false} linkTo={ROUTES.DASHBOARD} />
        )}
        <button
          onClick={toggle}
          className="hidden lg:flex p-1.5 rounded-lg text-text-secondary hover:bg-gray-100 hover:text-text-primary transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {/* Main Nav Items */}
        {mainNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onMobileClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
              )
            }
          >
            <item.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}

        {/* Device Management Collapsible Section */}
        <div className="pt-2 border-t border-border/60">
          {!collapsed ? (
            <div>
              <button
                type="button"
                onClick={() => setDevicesOpen(!devicesOpen)}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-bold text-text-secondary uppercase tracking-wider hover:text-primary transition-colors"
              >
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-primary" />
                  <span>Device Management</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${devicesOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {devicesOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pl-3 space-y-1 mt-1 overflow-hidden"
                  >
                    {deviceSubItems.map((sub) => (
                      <NavLink
                        key={sub.to}
                        to={sub.to}
                        onClick={onMobileClose}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200',
                            isActive
                              ? 'bg-primary/10 text-primary font-bold border-l-2 border-primary'
                              : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
                          )
                        }
                      >
                        <sub.icon className="w-4 h-4 shrink-0" />
                        <span>{sub.label}</span>
                      </NavLink>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-1 pt-1">
              {deviceSubItems.map((sub) => (
                <NavLink
                  key={sub.to}
                  to={sub.to}
                  onClick={onMobileClose}
                  title={sub.label}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-center p-2 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
                    )
                  }
                >
                  <sub.icon className="w-5 h-5 shrink-0" />
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Account & Preferences */}
        <div className="pt-2 border-t border-border/60 space-y-1">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onMobileClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  collapsed && 'justify-center px-2',
                  isActive
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
                )
              }
            >
              <item.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Support & Logout Footer */}
      <div className="px-3 py-4 border-t border-border space-y-1">
        <button
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium',
            'text-text-secondary hover:bg-gray-100 hover:text-text-primary transition-all duration-200',
            collapsed && 'justify-center px-2'
          )}
          aria-label="Support"
        >
          <HelpCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
          {!collapsed && <span>Support</span>}
        </button>
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium',
            'text-error hover:bg-error/10 transition-all duration-200',
            collapsed && 'justify-center px-2'
          )}
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5 shrink-0" aria-hidden="true" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-surface border-r border-border z-30"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={onMobileClose}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed left-0 top-0 h-screen w-[260px] bg-surface border-r border-border z-50 flex flex-col lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
