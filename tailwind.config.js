/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#1c1d22',
        surface: '#25272e',
        elevated: '#2e3038',
        line: '#3a3c44',
        divider: '#2a2c33',
        fg: '#f0f0f0',
        muted: '#9ca0aa',
        dim: '#5f626c',
        accent: '#5b8def',
        ok: '#4ade80',
        warn: '#f5b942',
        bad: '#f87171'
      },
      fontFamily: {
        sans: ['Helvetica', '"Helvetica Neue"', 'Arial', 'sans-serif']
      },
      borderRadius: {
        card: '8px',
        modal: '12px'
      },
      letterSpacing: {
        wider2: '0.18em'
      },
      boxShadow: {
        card: '0 2px 4px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.30)',
        'card-hover': '0 10px 24px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.40)'
      }
    }
  },
  plugins: []
}
