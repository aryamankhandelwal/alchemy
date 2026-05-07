/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0e0e0e',
        surface: '#161616',
        elevated: '#1c1c1c',
        line: '#262626',
        divider: '#1e1e1e',
        fg: '#f0f0f0',
        muted: '#888888',
        dim: '#5a5a5a',
        accent: '#e8d5a3',
        ok: '#4ade80',
        warn: '#fbbf24',
        bad: '#f87171'
      },
      fontFamily: {
        mono: ['"Fira Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      borderRadius: {
        card: '8px',
        modal: '12px'
      },
      letterSpacing: {
        wider2: '0.18em'
      }
    }
  },
  plugins: []
}
