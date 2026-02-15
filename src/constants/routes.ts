// Centralized route configuration
export const ROUTES = {
  // Public routes
  LANDING: '/',
  SIGNIN: '/signin',

  // Dashboard routes
  DASHBOARD: '/dashboard',
  DASHBOARD_PASSWORD: '/dashboard/dashboard-password',

  // Dashboard sub-routes
  CATEGORY: '/dashboard/categories',
  PRODUCTS: '/dashboard/products',
  CLIENTS: '/dashboard/clients',
  CUSTOMERS: '/dashboard/customers',
  INVOICES: '/dashboard/invoices',
  SALES: '/dashboard/sales',
  USERS: '/dashboard/users',
  WARRANTY_CHECK: '/dashboard/warranty-check',
  PRICE_LIST: '/dashboard/priceList',
  SCRAP_STOCK: '/dashboard/scrapStock',

  // API routes
  API: {
    AUTH: '/api/auth',
    TEST_PERFORMANCE: '/api/test-performance',
  },

  // Error routes
  AUTH_ERROR: '/auth/error',
} as const;

// Route groups for easier management
export const ROUTE_GROUPS = {
  DASHBOARD_ROUTES: [
    ROUTES.DASHBOARD,
    ROUTES.CATEGORY,
    ROUTES.PRODUCTS,
    ROUTES.CLIENTS,
    ROUTES.CUSTOMERS,
    ROUTES.INVOICES,
    ROUTES.SALES,
    // ROUTES.STOCK,
    ROUTES.USERS,
    ROUTES.WARRANTY_CHECK,
    ROUTES.PRICE_LIST,
    ROUTES.SCRAP_STOCK,
  ],

  PUBLIC_ROUTES: [ROUTES.LANDING, ROUTES.SIGNIN],

  ALLOWED_WHEN_LOCKED: [
    ROUTES.CATEGORY,
    ROUTES.PRODUCTS,
    ROUTES.CLIENTS,
    ROUTES.CUSTOMERS,
    ROUTES.SALES,
    // ROUTES.STOCK,
    ROUTES.INVOICES,
    ROUTES.USERS,
    ROUTES.PRICE_LIST,
    ROUTES.SCRAP_STOCK,
    ROUTES.WARRANTY_CHECK,
  ],
} as const;

// Computed route groups
export const AUTHENTICATED_ROUTES = [...ROUTE_GROUPS.DASHBOARD_ROUTES] as const;

// Helper functions
export const isDashboardRoute = (path: string): boolean => {
  return path.startsWith(ROUTES.DASHBOARD);
};

export const isSignInRoute = (path: string): boolean => {
  return path === ROUTES.SIGNIN;
};

export const isDashboardPasswordRoute = (path: string): boolean => {
  return path === ROUTES.DASHBOARD_PASSWORD;
};

export const isAllowedWhenLocked = (path: string): boolean => {
  return ROUTE_GROUPS.ALLOWED_WHEN_LOCKED.includes(path as any);
};

export const isPublicRoute = (path: string): boolean => {
  return ROUTE_GROUPS.PUBLIC_ROUTES.includes(path as any);
};

// Navigation items for sidebar
export const NAVIGATION_ITEMS = [
  {
    href: ROUTES.DASHBOARD,
    label: 'Dashboard',
    icon: 'MdDashboard',
  },
  {
    href: ROUTES.CATEGORY,
    label: 'Categories',
    icon: 'TbCategoryPlus',
  },
  {
    href: ROUTES.PRODUCTS,
    label: 'Products',
    icon: 'FaBox',
  },
  {
    href: ROUTES.INVOICES,
    label: 'Invoices',
    icon: 'FaFileInvoice',
  },
  {
    href: ROUTES.SALES,
    label: 'Sales',
    icon: 'FaFileInvoice',
  },
  {
    href: ROUTES.CUSTOMERS,
    label: 'Customers',
    icon: 'FaUserFriends',
  },
  {
    href: ROUTES.CLIENTS,
    label: 'Clients',
    icon: 'FaUserFriends',
  },
  {
    href: ROUTES.WARRANTY_CHECK,
    label: 'Warranty Check',
    icon: 'FaShieldAlt',
  },
] as const;

export default ROUTES;
