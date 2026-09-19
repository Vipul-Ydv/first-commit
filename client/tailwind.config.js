/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Original primary kept for any pages not yet redesigned */
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        /* HackMatch brand palette */
        hm: {
          /* Deep emerald green — brand anchor */
          green:      '#0F6B57',
          'green-dark':'#0A4F40',
          'green-mid': '#147A63',
          'green-light':'#E6F4F1',
          'green-faint':'#F0FAF7',
          /* Warm yellow — accent / match highlights */
          yellow:     '#F4D35E',
          'yellow-dark':'#D4A800',
          'yellow-light':'#FEF7D6',
          /* Coral — attention / deadline */
          coral:      '#F28C6B',
          'coral-dark':'#D4603A',
          'coral-light':'#FEF0EB',
          /* Warm neutrals */
          base:       '#FAF9F5',
          surface:    '#FFFFFF',
          border:     '#E3E6E1',
          text:       '#17201B',
          muted:      '#66706A',
          subtle:     '#9BA59F',
        },
        aws: {
          orange: '#FF9900',
          dark:   '#232F3E',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'hm-sm':  '0 1px 3px 0 rgba(15,107,87,0.08), 0 1px 2px -1px rgba(15,107,87,0.05)',
        'hm-md':  '0 4px 12px 0 rgba(15,107,87,0.10), 0 2px 4px -1px rgba(15,107,87,0.06)',
        'hm-lg':  '0 8px 24px 0 rgba(15,107,87,0.12), 0 4px 8px -2px rgba(15,107,87,0.08)',
        'hm-card':'0 2px 8px 0 rgba(23,32,27,0.06)',
      },
      borderRadius: {
        'hm': '10px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
