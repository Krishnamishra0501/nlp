/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "pastel-lavender": "#FAF7FF",
        "pastel-lilac": "#E8DFF5",
        "pastel-indigo": "#A5B4FC",
        "pastel-indigo-dark": "#6366F1",
        "risk-high-bg": "#F8B4B4",
        "risk-high-text": "#B91C1C",
        "risk-medium-bg": "#FDE8B8",
        "risk-medium-text": "#92400E",
        "risk-low-bg": "#BBF0D4",
        "risk-low-text": "#166534"
      },
    },
  },
  plugins: [],
};
