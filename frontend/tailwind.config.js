/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light nude background palette -> Pure White theme
        nude: {
          bg: '#FFFFFF',
          bgAlt: '#FFFFFF',
          bgSection: '#FFFFFF',
          bgMuted: '#F1F5F9',
          card: '#FFFFFF',
          cardSec: '#FFFFFF',
          peachTint: '#FEF2F2',
          lavenderTint: '#F5F3FF',
          sageTint: '#ECFDF5',
          blueTint: '#EFF6FF',
          yellowTint: '#FFFBEB',
        },
        // Thick high-contrast text colors
        textLight: {
          primary: '#1E293B',
          secondary: '#334155',
          muted: '#475569',
          heading: '#0F172A',
        },
        // Light accents -> Thick vibrant accents
        lightAccent: {
          rose: '#DC2626',
          blush: '#EF4444',
          peach: '#EA580C',
          coral: '#E11D48',
          lavender: '#7C3AED',
          purple: '#6D28D9',
          sage: '#059669',
          mint: '#10B981',
          powderBlue: '#2563EB',
          softBlue: '#1D4ED8',
          yellow: '#D97706',
          cream: '#F59E0B',
        },
        // Night background palette
        night: {
          bg: '#0F172A',
          bgAlt: '#1E293B',
          bgSection: '#334155',
          card: '#1E293B',
          cardElevated: '#334155',
          cardSoft: '#334155',
        },
        // Night text colors
        textNight: {
          primary: '#F8FAFC',
          secondary: '#E2E8F0',
          muted: '#94A3B8',
          heading: '#FFFFFF',
        },
        // Night accents
        nightAccent: {
          rose: '#F87171',
          peach: '#FB923C',
          lavender: '#A78BFA',
          sage: '#34D399',
          powderBlue: '#60A5FA',
          cyan: '#38BDF8',
          yellow: '#FBBF24',
          coral: '#F43F5E',
        }
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
        decorative: ['"Playfair Display"', 'serif'],
        cute: ['Quicksand', 'sans-serif'],
        accent: ['Nunito', 'sans-serif'],
      },
      boxShadow: {
        'nude-soft': '0 8px 30px rgba(91, 69, 60, 0.06)',
        'nude-hover': '0 12px 36px rgba(91, 69, 60, 0.10)',
        'night-soft': '0 10px 30px rgba(0, 0, 0, 0.20)',
        'night-hover': '0 14px 40px rgba(0, 0, 0, 0.35)',
      },
      borderRadius: {
        'card-sm': '16px',
        'card-md': '20px',
        'card-lg': '24px',
        'card-xl': '28px',
      }
    },
  },
  plugins: [],
}
