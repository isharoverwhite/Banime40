/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#0b0d16',
        surface: '#161828',
        border:  '#252740',
        muted:   '#7880a8',

        'surface-container':         '#1a1c32',
        'surface-container-high':    '#22244a',
        'surface-container-highest': '#2c2e5c',
        'surface-container-low':     '#11132a',
        'on-surface':                '#e8e9f8',
        'on-surface-variant':        '#a8aacc',
        'outline-variant':           '#2e3060',

        blue:    '#a78bfa',   // violet — primary
        amber:   '#f97316',   // orange — layer triggers
        green:   '#34d399',   // emerald — nav / success
        red:     '#f87171',
        cyan:    '#38bdf8',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'key':          '0 3px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)',
        'key-hover':    '0 5px 16px rgba(167,139,250,0.28), inset 0 1px 0 rgba(255,255,255,0.09)',
        'key-selected': '0 0 0 2px #a78bfa, 0 0 20px rgba(167,139,250,0.6)',
        'key-glow':     '0 0 14px rgba(167,139,250,0.45)',
        'modal':        '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(167,139,250,0.18)',
        'case':         '0 28px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(167,139,250,0.1)',
      },
      backgroundImage: {
        'keycap':     'linear-gradient(145deg, #252848 0%, #161830 100%)',
        'keycap-sel': 'linear-gradient(145deg, rgba(167,139,250,0.22) 0%, rgba(167,139,250,0.08) 100%)',
        'case-outer': 'linear-gradient(145deg, #22244a 0%, #161830 100%)',
        'case-inner': 'linear-gradient(160deg, #1a1c30 0%, #0e1020 100%)',
        'hero-glow':  'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(167,139,250,0.14), transparent 70%)',
      },
    },
  },
  plugins: [],
}
