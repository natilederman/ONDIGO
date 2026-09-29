import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        paper: 'var(--paper)',
        ground: 'var(--ground)',
        ash: 'var(--ash)',
        line: 'var(--rule)',
        'line-strong': 'var(--rule-hi)',
        steel: 'var(--steel)',
        muted: 'var(--steel-2)',
        signal: 'var(--signal)',
        // the single accent keeps one meaning: time running out
        accent: {
          DEFAULT: 'var(--signal)',
          light: 'var(--ash)',
          dark: 'var(--signal)',
        },
      },
      fontFamily: {
        sans: ['var(--font-archivo)', 'system-ui', 'sans-serif'],
      },
      // one radius rule for the whole site: pills for controls, square for everything else
      borderRadius: {
        card: '0px',
      },
      letterSpacing: {
        display: '-0.038em',
      },
    },
  },
  plugins: [],
};

export default config;
