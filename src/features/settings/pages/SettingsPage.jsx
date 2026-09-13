import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Moon, Globe, Mail, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../../components/common/PageHeader';
import Breadcrumb from '../../../components/common/Breadcrumb';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/common/Card';
import TwoFactorSetup from '../components/TwoFactorSetup';
import ChangePasswordForm from '../../authentication/components/ChangePasswordForm';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../../../utils/constants';
import { cn } from '../../../utils/helpers';

function Toggle({ enabled, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description && <p className="text-xs text-text-secondary mt-0.5">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200',
          enabled ? 'gradient-yuga' : 'bg-gray-200'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
            enabled && 'translate-x-5'
          )}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [theme, setTheme] = useLocalStorage(STORAGE_KEYS.THEME, 'light');
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    energy: true,
    community: true,
  });

  const handleThemeToggle = (dark) => {
    const newTheme = dark ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', dark);
    toast.success(`Switched to ${newTheme} mode`);
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Settings' }]} />
      <PageHeader title="Settings" subtitle="Manage your account preferences and security" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change Password Card Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="border-border shadow-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" />
                <CardTitle>Change Password</CardTitle>
              </div>
              <CardDescription>
                Update your account password with Firebase Authentication security validation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>Configure how you receive updates</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              <Toggle
                label="Email notifications"
                description="Receive updates via email"
                enabled={notifications.email}
                onChange={(v) => setNotifications({ ...notifications, email: v })}
              />
              <Toggle
                label="Push notifications"
                description="Browser push notifications"
                enabled={notifications.push}
                onChange={(v) => setNotifications({ ...notifications, push: v })}
              />
              <Toggle
                label="Energy alerts"
                description="Generation and consumption alerts"
                enabled={notifications.energy}
                onChange={(v) => setNotifications({ ...notifications, energy: v })}
              />
              <Toggle
                label="Community updates"
                description="News from your energy community"
                enabled={notifications.community}
                onChange={(v) => setNotifications({ ...notifications, community: v })}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Appearance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Moon className="w-5 h-5 text-secondary" />
                <CardTitle>Appearance</CardTitle>
              </div>
              <CardDescription>Customize the look and feel</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              <Toggle
                label="Dark mode"
                description="Switch to dark theme"
                enabled={theme === 'dark'}
                onChange={handleThemeToggle}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Two Factor Setup */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2">
          <TwoFactorSetup />
        </motion.div>

        {/* Regional Preferences */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-success" />
                <CardTitle>Preferences</CardTitle>
              </div>
              <CardDescription>Language and regional settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Language
                </label>
                <select className="w-full px-4 py-2.5 text-sm bg-surface border border-border rounded-[var(--radius-input)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="ta">Tamil</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email digest
                </label>
                <select className="w-full px-4 py-2.5 text-sm bg-surface border border-border rounded-[var(--radius-input)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="never">Never</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
