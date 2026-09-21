import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        teal: 'var(--color-teal)',
        amber: 'var(--color-amber)',
        charcoal: 'var(--color-charcoal)',
        mint: 'var(--color-mint)',
      },
    },
  },
  plugins: [],
};

export default config;
