import type { Config } from 'tailwindcss';
import { theme } from './src/styles/theme';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/landing/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: theme.colors,
      spacing: {
        ...theme.spacing,
        '36': '9rem',
        '40': '10rem',
      },
      borderRadius: theme.borderRadius,
      boxShadow: theme.shadows,
      fontFamily: {
        sans: ['Inter', 'system-ui', 'arial', 'sans-serif'] as string[],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'] as string[],
      },
      fontSize: theme.typography.fontSize,
      fontWeight: theme.typography.fontWeight,
      transitionDuration: theme.animation.duration,
      transitionTimingFunction: theme.animation.easing,
      screens: theme.breakpoints,
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
export default config;
