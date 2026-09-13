export const USER_ROLES = {
  PRODUCER: 'producer',
  CONSUMER: 'consumer',
  BUSINESS: 'business',
  PROSUMER: 'producer',
  ADMIN: 'admin',
};

export const ROUTES = {
  HOME: '/',
  LANDING: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  CHANGE_PASSWORD: '/change-password',
  PHONE_LOGIN: '/phone-login',
  VERIFY_EMAIL: '/verify-email',
  DASHBOARD: '/dashboard',
  DASHBOARD_CONSUMER: '/dashboard/consumer',
  DASHBOARD_PRODUCER: '/dashboard/producer',
  DASHBOARD_BUSINESS: '/dashboard/business',
  AUDIT_TRAIL: '/audit-trail',
  SYSTEMS: '/systems',
  GENERATION: '/generation',
  CONSUMPTION: '/consumption',
  MARKETPLACE: '/marketplace',
  BLOCKCHAIN: '/blockchain',
  REPORTS: '/reports',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  DEVICES: '/devices',
  DEVICES_SMART_METER: '/devices/smart-meter',
  DEVICES_BATTERY: '/devices/battery',
  DEVICES_SOLAR_INVERTER: '/devices/solar-inverter',
  DEVICES_SYNC: '/devices/sync',
  DEVICES_STATUS: '/devices/status',
  NOT_FOUND: '*',
};

export const STORAGE_KEYS = {
  REMEMBER_EMAIL: 'yuga_remember_email',
  THEME: 'yuga_theme',
  SIDEBAR_COLLAPSED: 'yuga_sidebar_collapsed',
};

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PHONE_PATTERN: /^[+]?[\d\s-()]{10,15}$/,
};

export const APP_NAME = 'YUGA';
export const APP_TAGLINE = 'A New Era of Energy';
export const APP_DESCRIPTION = 'Renewable Energy Community Platform';
export const APP_LOGO = '/yuga-logo.png';
