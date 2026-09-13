import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Menu,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import Avatar from '../Avatar';
import { useAuth } from '../../../context/AuthContext';
import { useSidebar } from '../../../hooks/useLocalStorage';
import { cn } from '../../../utils/helpers';
import { ROUTES } from '../../../utils/constants';
import toast from 'react-hot-toast';

const dummyNotifications = [
  { id: 1, title: 'Energy milestone reached', time: '2h ago', unread: true },
  { id: 2, title: 'Community update available', time: '5h ago', unread: true },
  { id: 3, title: 'Profile verification pending', time: '1d ago', unread: false },
];

export default function Navbar({ onMenuClick }) {
  const { user, userProfile, logout } = useAuth();
  const { collapsed } = useSidebar();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      toast.success('Signed out successfully');
      navigate(ROUTES.LOGIN);
    } else {
      toast.error(result.error);
    }
  };

  const displayName = userProfile?.fullName || user?.displayName || 'User';
  const unreadCount = dummyNotifications.filter((n) => n.unread).length;

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-20 h-16 bg-surface/80 backdrop-blur-xl border-b border-border',
        'transition-all duration-300',
        collapsed ? 'left-[72px]' : 'left-[260px]',
        'max-lg:left-0'
      )}
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-text-secondary hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative max-w-md flex-1 hidden sm:block">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search solar devices, marketplace offers, or transactions..."
              className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-background/80 border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
              aria-label="Search"
            />
          </div>
        </div>

        {/* User Role Badge */}
        <div className="hidden sm:flex items-center mr-3">
          <span className={`px-3 py-1 text-[11px] font-extrabold uppercase rounded-full tracking-wider border shadow-xs flex items-center gap-1.5 ${
            userProfile?.role === 'producer' || userProfile?.role === 'prosumer'
              ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
              : userProfile?.role === 'business'
              ? 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30'
              : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {userProfile?.role || 'consumer'} portal
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="relative p-2 rounded-xl text-text-secondary hover:bg-gray-100 transition-colors"
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 bg-surface rounded-[var(--radius-card)] border border-border shadow-[var(--shadow-elevated)] overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-border">
                    <h3 className="font-semibold text-text-primary">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {dummyNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={cn(
                          'px-4 py-3 border-b border-border last:border-0 hover:bg-gray-50 transition-colors cursor-pointer',
                          notif.unread && 'bg-primary/5'
                        )}
                      >
                        <p className="text-sm font-medium text-text-primary">{notif.title}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{notif.time}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-gray-100 transition-colors"
              aria-label="User menu"
              aria-expanded={showProfileMenu}
            >
              <Avatar
                src={userProfile?.photoURL}
                name={displayName}
                size="sm"
              />
              <span className="hidden md:block text-sm font-medium text-text-primary max-w-[120px] truncate">
                {displayName}
              </span>
              <ChevronDown className="w-4 h-4 text-text-secondary hidden md:block" />
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 bg-surface rounded-[var(--radius-card)] border border-border shadow-[var(--shadow-elevated)] overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold text-text-primary truncate">{displayName}</p>
                    <p className="text-xs text-text-secondary truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to={ROUTES.PROFILE}
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:bg-gray-50 hover:text-text-primary transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link
                      to={ROUTES.SETTINGS}
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:bg-gray-50 hover:text-text-primary transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </div>
                  <div className="border-t border-border py-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-error hover:bg-error/5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
