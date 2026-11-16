/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stadium: {
          950: '#06090F',
          900: '#0B0F17',
          850: '#101724',
          800: '#161F30',
          750: '#1B263B',
          700: '#23324D',
          600: '#334155'
        },
        gold: {
          300: '#FDE68A',
          400: '#FCD34D',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309'
        },
        pitch: {
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857'
        },
        electric: {
          400: '#38BDF8',
          500: '#06B6D4',
          600: '#0284C7'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['Rajdhani', 'Impact', 'Arial Black', 'Trebuchet MS', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace']
      },
      boxShadow: {
        'gold-glow': '0 0 25px -5px rgba(245, 158, 11, 0.45)',
        'pitch-glow': '0 0 25px -5px rgba(16, 185, 129, 0.45)',
        'electric-glow': '0 0 25px -5px rgba(6, 182, 212, 0.45)',
        'stadium-beam': '0 -20px 80px -10px rgba(16, 185, 129, 0.25)',
        'fut-icon': '0 10px 30px -5px rgba(245, 158, 11, 0.6), 0 0 15px rgba(251, 191, 36, 0.3)',
        'fut-diamond': '0 10px 30px -5px rgba(6, 182, 212, 0.6), 0 0 15px rgba(147, 51, 234, 0.3)'
      },
      backgroundImage: {
        'stadium-radial': 'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.12) 0%, rgba(11, 15, 23, 0.98) 75%)',
        'gold-gradient': 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 50%, #92400E 100%)',
        'icon-shimmer': 'linear-gradient(135deg, #FFE259 0%, #FFA751 100%)',
        'pitch-gradient': 'linear-gradient(135deg, #10B981 0%, #047857 100%)'
      }
    },
  },
  plugins: [],
}

