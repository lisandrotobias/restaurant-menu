/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {
      colors: {
        'accent': 'var(--accent-color)',
      },
      fontFamily: {
        'primary': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },

  plugins: [
    require('daisyui')
  ],

  daisyui: {
    themes: ["light"]
  }
};
