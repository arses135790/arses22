module.exports = {
  content: ['./renderer/src/**/*.{js,jsx}', './renderer/ui/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)', foreground: 'var(--foreground)',
        primary: { DEFAULT: 'var(--primary)', foreground: 'var(--primary-foreground)' },
        secondary: { DEFAULT: 'var(--secondary)', foreground: 'var(--secondary-foreground)' },
        accent: { DEFAULT: 'var(--accent)', foreground: 'var(--accent-foreground)' },
        muted: { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
        popover: { DEFAULT: 'var(--popover)', foreground: 'var(--popover-foreground)' },
        card: { DEFAULT: 'var(--card)', foreground: 'var(--card-foreground)' },
        border: 'var(--border)', input: 'var(--input)', ring: 'var(--ring)',
        destructive: { DEFAULT: '#b72e26', foreground: '#ffffff' }
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
};
