/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        '3xl': '1920px',
        '4xl': '2560px',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: 'hsl(240, 10%, 98%)',
          100: 'hsl(240, 10%, 92%)',
          200: 'hsl(240, 10%, 84%)',
          300: 'hsl(240, 10%, 76%)',
          400: 'hsl(240, 10%, 68%)',
          500: 'hsl(240, 10%, 60%)',
          600: 'hsl(240, 10%, 52%)',
          700: 'hsl(240, 10%, 44%)',
          800: 'hsl(240, 10%, 36%)',
          900: 'hsl(240, 10%, 28%)',
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          50: 'hsl(142, 76%, 97%)',
          100: 'hsl(142, 72%, 90%)',
          200: 'hsl(142, 68%, 82%)',
          300: 'hsl(142, 64%, 71%)',
          400: 'hsl(142, 60%, 63%)',
          500: 'hsl(142, 56%, 45%)',
          600: 'hsl(142, 52%, 38%)',
          700: 'hsl(142, 48%, 31%)',
          800: 'hsl(142, 44%, 24%)',
          900: 'hsl(142, 40%, 17%)',
        },
        danger: {
          50: 'hsl(0, 86%, 97%)',
          100: 'hsl(0, 82%, 89%)',
          200: 'hsl(0, 78%, 81%)',
          300: 'hsl(0, 74%, 73%)',
          400: 'hsl(0, 70%, 65%)',
          500: 'hsl(0, 66%, 47%)',
          600: 'hsl(0, 62%, 40%)',
          700: 'hsl(0, 58%, 33%)',
          800: 'hsl(0, 54%, 26%)',
          900: 'hsl(0, 50%, 19%)',
        },
        warning: {
          50: 'hsl(45, 100%, 96%)',
          100: 'hsl(45, 96%, 89%)',
          200: 'hsl(45, 92%, 80%)',
          300: 'hsl(45, 88%, 70%)',
          400: 'hsl(45, 84%, 60%)',
          500: 'hsl(45, 80%, 50%)',
          600: 'hsl(45, 76%, 40%)',
          700: 'hsl(45, 72%, 30%)',
          800: 'hsl(45, 68%, 20%)',
          900: 'hsl(45, 64%, 10%)',
        },
        dark: {
          50: 'hsl(240, 10%, 98%)',
          100: 'hsl(240, 10%, 92%)',
          200: 'hsl(240, 10%, 84%)',
          300: 'hsl(240, 10%, 76%)',
          400: 'hsl(240, 10%, 68%)',
          500: 'hsl(240, 10%, 60%)',
          600: 'hsl(240, 10%, 52%)',
          700: 'hsl(240, 10%, 44%)',
          800: 'hsl(240, 10%, 36%)',
          900: 'hsl(240, 10%, 28%)',
          950: 'hsl(240, 10%, 4%)',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(255, 255, 255, 0.1)' },
          '50%': { boxShadow: '0 0 20px rgba(255, 255, 255, 0.15)' },
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(255, 255, 255, 0.1)',
        'glow-sm': '0 0 10px rgba(255, 255, 255, 0.05)',
      },
    },
  },
  plugins: [typography],
} 