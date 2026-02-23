/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0E0E0E',
          surface: '#161616',
          'surface-light': '#1E1E1E',
          gold: '#FFD700',
          'gold-soft': '#F5C77A',
          'gold-muted': '#C4A35A',
          text: '#FFFFFF',
          'text-muted': '#B5B5B5',
          'text-dim': '#6B6B6B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'nav': ['13px', { lineHeight: '1', fontWeight: '600' }],
        'product-name': ['15px', { lineHeight: '1.3', fontWeight: '600' }],
        'product-price': ['17px', { lineHeight: '1.2', fontWeight: '700' }],
        'section-heading': ['19px', { lineHeight: '1.2', fontWeight: '700' }],
        'page-heading': ['22px', { lineHeight: '1.2', fontWeight: '800' }],
      },
      boxShadow: {
        'card': '0 2px 12px rgba(0,0,0,0.4)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.5), 0 0 1px rgba(255,215,0,0.1)',
        'elevated': '0 8px 32px rgba(0,0,0,0.6)',
        'glass': '0 8px 32px rgba(0,0,0,0.5)',
        'glow-gold': '0 0 20px rgba(255,215,0,0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16,1,0.3,1)',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.16,1,0.3,1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1)',
        'bounce-subtle': 'bounceSubtle 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'marquee': 'marquee 25s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceSubtle: {
          '0%': { transform: 'scale(0.95)' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
