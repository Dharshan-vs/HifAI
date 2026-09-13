import { Navigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PageLoader } from '../components/common/Loader';
import { useAuth } from '../context/AuthContext';
import { ROUTES, USER_ROLES } from '../utils/constants';

export function getRoleDashboardRoute(role) {
  switch (role) {
    case USER_ROLES.ADMIN:
      return ROUTES.AUDIT_TRAIL;
    case USER_ROLES.PRODUCER:
    case 'prosumer':
      return ROUTES.DASHBOARD_PRODUCER;
    case USER_ROLES.BUSINESS:
      return ROUTES.DASHBOARD_BUSINESS;
    case USER_ROLES.CONSUMER:
    default:
      return ROUTES.DASHBOARD_CONSUMER;
  }
}

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return children;
}

export function RoleProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  const currentRole = userProfile?.role || USER_ROLES.CONSUMER;
  const isAllowed = allowedRoles.includes(currentRole) || (allowedRoles.includes(USER_ROLES.PRODUCER) && currentRole === 'prosumer');

  if (!isAllowed) {
    toast.error(`Access Restricted: Logged in as ${currentRole.toUpperCase()}. Redirected to your authorized portal.`);
    return <Navigate to={getRoleDashboardRoute(currentRole)} replace />;
  }

  return children;
}

export function DashboardIndexRedirect() {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  const userRole = userProfile?.role || USER_ROLES.CONSUMER;
  return <Navigate to={getRoleDashboardRoute(userRole)} replace />;
}

export function PublicRoute({ children }) {
  const { isAuthenticated, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    const defaultDashboard = getRoleDashboardRoute(userProfile?.role);
    const from = location.state?.from?.pathname || defaultDashboard;
    return <Navigate to={from} replace />;
  }

  return children;
}

export function EmailVerificationBanner() {
  const { isEmailVerified, user } = useAuth();

  if (!user?.email || isEmailVerified) return null;

  return (
    <div className="fixed top-16 right-0 left-0 lg:left-[260px] z-10 bg-accent/10 border-b border-accent/20 px-4 py-2 text-center">
      <p className="text-sm text-accent">
        Please verify your email address.{' '}
        <Link to={ROUTES.VERIFY_EMAIL} className="font-medium underline hover:no-underline">
          Verify now
        </Link>
      </p>
    </div>
  );
}
