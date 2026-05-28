import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme colors
        background: {
          primary: '#0A0E27',
          secondary: '#111827',
          tertiary: '#1F2937',
        },
        border: {
          primary: '#374151',
          secondary: '#1F2937',
        },
        text: {
          primary: '#F9FAFB',
          secondary: '#9CA3AF',
          tertiary: '#6B7280',
        },
        // Brand colors
        primary: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
        },
        secondary: {
          DEFAULT: '#8B5CF6',
          hover: '#7C3AED',
        },
        accent: {
          DEFAULT: '#10B981',
          hover: '#059669',
        },
        // Trading colors
        long: {
          DEFAULT: '#10B981',
          light: '#34D399',
          dark: '#059669',
        },
        short: {
          DEFAULT: '#EF4444',
          light: '#F87171',
          dark: '#DC2626',
        },
        // Status colors
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
    },
  },
  plugins: [],
}

export default config
