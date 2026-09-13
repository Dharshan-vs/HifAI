import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PageLoader } from '../components/common/Loader';
import DashboardLayout from '../components/layout/DashboardLayout';
import AuthLayout from '../components/layout/AuthLayout';
import { ProtectedRoute, PublicRoute, RoleProtectedRoute, DashboardIndexRedirect } from './ProtectedRoute';
import { RouteErrorBoundary } from '../components/common/ErrorBoundary';
import { ROUTES, USER_ROLES } from '../utils/constants';

const LandingPage = lazy(() => import('../features/landing/pages/LandingPage'));
const LoginPage = lazy(() => import('../features/authentication/pages/LoginPage'));
const SignupPage = lazy(() => import('../features/authentication/pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('../features/authentication/pages/ForgotPasswordPage'));
const PhoneLoginPage = lazy(() => import('../features/authentication/pages/PhoneLoginPage'));
const ChangePasswordPage = lazy(() => import('../features/authentication/pages/ChangePasswordPage'));
const VerifyEmailPage = lazy(() => import('../features/authentication/pages/VerifyEmailPage'));
const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage'));
const SystemsPage = lazy(() => import('../features/systems/pages/SystemsPage'));
const GenerationPage = lazy(() => import('../features/generation/pages/GenerationPage'));
const ConsumptionPage = lazy(() => import('../features/consumption/pages/ConsumptionPage'));
const MarketplacePage = lazy(() => import('../features/marketplace/pages/MarketplacePage'));
const BlockchainPage = lazy(() => import('../features/blockchain/pages/BlockchainPage'));
const ReportsPage = lazy(() => import('../features/reports/pages/ReportsPage'));
const ProfilePage = lazy(() => import('../features/profile/pages/ProfilePage'));
const SettingsPage = lazy(() => import('../features/settings/pages/SettingsPage'));
const DevicesPage = lazy(() => import('../features/devices/pages/DevicesPage'));
const SmartMeterPage = lazy(() => import('../features/devices/pages/SmartMeterPage'));
const BatteryManagementPage = lazy(() => import('../features/devices/pages/BatteryManagementPage'));
const SolarInverterPage = lazy(() => import('../features/devices/pages/SolarInverterPage'));
const SynchronizationPage = lazy(() => import('../features/devices/pages/SynchronizationPage'));
const ConnectionStatusPage = lazy(() => import('../features/devices/pages/ConnectionStatusPage'));
const AuditTrailPage = lazy(() => import('../features/audit/pages/AuditTrailPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

function LazyPage({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: ROUTES.HOME, // '/'
    element: <LazyPage><LandingPage /></LazyPage>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/landing',
    element: <LazyPage><LandingPage /></LazyPage>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    element: <AuthLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: ROUTES.LOGIN,
        element: (
          <PublicRoute>
            <LazyPage><LoginPage /></LazyPage>
          </PublicRoute>
        ),
      },
      {
        path: ROUTES.SIGNUP,
        element: (
          <PublicRoute>
            <LazyPage><SignupPage /></LazyPage>
          </PublicRoute>
        ),
      },
      {
        path: ROUTES.FORGOT_PASSWORD,
        element: (
          <PublicRoute>
            <LazyPage><ForgotPasswordPage /></LazyPage>
          </PublicRoute>
        ),
      },
      {
        path: ROUTES.PHONE_LOGIN,
        element: (
          <PublicRoute>
            <LazyPage><PhoneLoginPage /></LazyPage>
          </PublicRoute>
        ),
      },
    ],
  },
  {
    path: ROUTES.VERIFY_EMAIL,
    element: (
      <ProtectedRoute>
        <LazyPage><VerifyEmailPage /></LazyPage>
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: ROUTES.DASHBOARD,
        element: <DashboardIndexRedirect />,
      },
      {
        path: ROUTES.DASHBOARD_CONSUMER,
        element: (
          <RoleProtectedRoute allowedRoles={[USER_ROLES.CONSUMER]}>
            <LazyPage><DashboardPage forcedRole={USER_ROLES.CONSUMER} /></LazyPage>
          </RoleProtectedRoute>
        ),
      },
      {
        path: ROUTES.DASHBOARD_PRODUCER,
        element: (
          <RoleProtectedRoute allowedRoles={[USER_ROLES.PRODUCER, 'prosumer']}>
            <LazyPage><DashboardPage forcedRole={USER_ROLES.PRODUCER} /></LazyPage>
          </RoleProtectedRoute>
        ),
      },
      {
        path: ROUTES.DASHBOARD_BUSINESS,
        element: (
          <RoleProtectedRoute allowedRoles={[USER_ROLES.BUSINESS]}>
            <LazyPage><DashboardPage forcedRole={USER_ROLES.BUSINESS} /></LazyPage>
          </RoleProtectedRoute>
        ),
      },
      {
        path: ROUTES.AUDIT_TRAIL,
        element: (
          <RoleProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.CONSUMER, USER_ROLES.PRODUCER, USER_ROLES.BUSINESS, 'prosumer']}>
            <LazyPage><AuditTrailPage /></LazyPage>
          </RoleProtectedRoute>
        ),
      },
      {
        path: ROUTES.SYSTEMS,
        element: <LazyPage><SystemsPage /></LazyPage>,
      },
      {
        path: ROUTES.GENERATION,
        element: <LazyPage><GenerationPage /></LazyPage>,
      },
      {
        path: ROUTES.CONSUMPTION,
        element: <LazyPage><ConsumptionPage /></LazyPage>,
      },
      {
        path: ROUTES.MARKETPLACE,
        element: <LazyPage><MarketplacePage /></LazyPage>,
      },
      {
        path: ROUTES.BLOCKCHAIN,
        element: <Navigate to={ROUTES.MARKETPLACE} replace />,
      },
      {
        path: ROUTES.REPORTS,
        element: <LazyPage><ReportsPage /></LazyPage>,
      },
      {
        path: ROUTES.PROFILE,
        element: <LazyPage><ProfilePage /></LazyPage>,
      },
      {
        path: ROUTES.SETTINGS,
        element: <LazyPage><SettingsPage /></LazyPage>,
      },
      {
        path: ROUTES.CHANGE_PASSWORD,
        element: <LazyPage><ChangePasswordPage /></LazyPage>,
      },
      {
        path: ROUTES.DEVICES,
        element: <LazyPage><DevicesPage /></LazyPage>,
      },
      {
        path: ROUTES.DEVICES_SMART_METER,
        element: <LazyPage><SmartMeterPage /></LazyPage>,
      },
      {
        path: ROUTES.DEVICES_BATTERY,
        element: <LazyPage><BatteryManagementPage /></LazyPage>,
      },
      {
        path: ROUTES.DEVICES_SOLAR_INVERTER,
        element: <LazyPage><SolarInverterPage /></LazyPage>,
      },
      {
        path: ROUTES.DEVICES_SYNC,
        element: <LazyPage><SynchronizationPage /></LazyPage>,
      },
      {
        path: ROUTES.DEVICES_STATUS,
        element: <LazyPage><ConnectionStatusPage /></LazyPage>,
      },
    ],
  },
  {
    path: ROUTES.NOT_FOUND,
    element: <LazyPage><NotFoundPage /></LazyPage>,
  },
  {
    path: '*',
    element: <Navigate to={ROUTES.NOT_FOUND} replace />,
  },
]);
