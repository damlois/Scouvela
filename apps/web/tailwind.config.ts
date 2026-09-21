import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary)',
          dark: 'var(--primary-dark)',
        },
        accent: 'var(--accent)',
        text: 'var(--text)',
        muted: 'var(--muted-text)',
        background: 'var(--background)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        error: 'var(--error)',
        success: 'var(--success)',
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        copy: '40rem',
      },
    },
  },
  plugins: [],
};

export default config;
