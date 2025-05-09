/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class", // This is crucial for manual dark mode toggling
  theme: {
    extend: {},
  },
  plugins: [],
};
