/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        glow: "glow 2s ease-in-out infinite alternate",
        expand: "expand 1s ease-out forwards",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 12s linear infinite",
        "fade-in": "fadeIn 0.5s ease-out forwards",
      },
      keyframes: {
        glow: {
          "0%": {
            boxShadow: "0 0 5px #ffdb4d, 0 0 10px #ffdb4d, 0 0 15px #f0a500",
          },
          "100%": {
            boxShadow:
              "0 0 20px #ffdb4d, 0 0 30px #ffdb4d, 0 0 40px #f0a500, 0 0 50px #f0a500",
          },
        },
        expand: {
          "0%": { transform: "scale(1)", opacity: "0.8" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
        fadeIn: {
            "0%": { opacity: "0" },
            "100%": { opacity: "1" },
        },
      },
      colors: {
        gold: {
          100: "#fff9c4",
          400: "#ffee58",
          500: "#ffeb3b",
          700: "#fbc02d",
          900: "#f57f17",
        },
      },
    },
  },
  plugins: [],
};
