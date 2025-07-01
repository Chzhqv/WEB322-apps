module.exports = {
  content: ['./views/**/*.ejs'],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui'), require('@tailwindcss/typography')],
  daisyui: {
    themes: ['light'],
  },
  safelist: [
    'table',
    'table-zebra',
    'btn',
    'btn-primary',
     
  ],
};