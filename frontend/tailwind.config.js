/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        netland: {
          primary: "var(--netland-primary)",
          primaryDark: "var(--netland-primary-dark)",
          secondary: "var(--netland-secondary)",
          accent: "var(--netland-accent)",
          dark: "var(--netland-dark)",
          light: "var(--netland-light)",
          background: "var(--netland-background)",
          text: "var(--netland-text)",
          muted: "var(--netland-muted)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 30px rgba(20, 61, 45, 0.10)",
        lift: "0 18px 40px rgba(20, 61, 45, 0.16)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.8s ease-out both",
        fadeIn: "fadeIn 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};