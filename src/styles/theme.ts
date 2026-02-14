// Design System - Centralized theme tokens and design constants

export const theme = {
  colors: {
    // Brand Colors
    primary: '#193043',
    primaryHover: '#2a4156',
    primaryLight: '#f0f4f8',
    primaryMoreLight:"#213F63",
    primaryDark: '#0f1e2e',
    custom: '#213F63',
    
    // Additional brand variants found in app
    primaryVariant1: '#1e3a5f',
    primaryVariant2: '#234466',
    darkBlue: '#021B3B',
    hoverBlue: '#0056b3',
    grayText: '#6B6B6B',
    
    // Semantic Colors
    success: '#10b981',
    successBg: '#dcfce7',
    successText: '#166534',
    
    error: '#ef4444',
    errorBg: '#fef2f2',
    errorText: '#991b1b',
    
    warning: '#f59e0b',
    warningBg: '#fffbeb',
    warningText: '#92400e',
    
    info: '#3b82f6',
    infoBg: '#eff6ff',
    infoText: '#1e40af',
    
    // Google Brand Colors
    googleBlue: '#4285F4',
    googleGreen: '#34A853',
    googleYellow: '#FBBC05',
    googleRed: '#EA4335',
    
    // Neutral Colors
    white: '#ffffff',
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray800: '#1f2937',
    gray900: '#111827',
  },
  
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },
  
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',     // 16px
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'arial', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    },
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

// Utility functions for common patterns
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Common gradient definitions
export const gradients = {
  primary: 'linear-gradient(to right, #193043, #1e3a5f, #234466)',
  background: 'linear-gradient(to bottom right, #f0f4f8, #e1e7ed)',
  success: 'linear-gradient(to right, #10b981, #059669)',
  error: 'linear-gradient(to right, #ef4444, #dc2626)',
  warning: 'linear-gradient(to right, #f59e0b, #d97706)',
  info: 'linear-gradient(to right, #3b82f6, #2563eb)',
} as const;

// Common shadow utilities
export const shadows = {
  card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  dropdown: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  button: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
} as const;

// Status color utilities
export const statusColors = {
  active: {
    bg: theme.colors.successBg,
    text: theme.colors.successText,
    border: theme.colors.success,
  },
  inactive: {
    bg: theme.colors.gray100,
    text: theme.colors.gray600,
    border: theme.colors.gray300,
  },
  pending: {
    bg: theme.colors.warningBg,
    text: theme.colors.warningText,
    border: theme.colors.warning,
  },
  error: {
    bg: theme.colors.errorBg,
    text: theme.colors.errorText,
    border: theme.colors.error,
  },
} as const;
