/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FDFCF8",
          100: "#F9F7F2",
          200: "#F3EFE6",
        },
        charcoal: {
          DEFAULT: "#1A1A1A",
          800: "#2D2D2D",
          700: "#3D3D3D",
        },
        gold: {
          DEFAULT: "#FACC15",
          light: "#FDE68A",
          dark: "#EAB308",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        soft: "0 8px 32px rgba(26, 26, 26, 0.06)",
        glass: "0 4px 24px rgba(26, 26, 26, 0.04)",
      },
      backdropBlur: {
        glass: "12px",
      },
    },
  },
  plugins: [],
};
