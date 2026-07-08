import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Phapano brand system. Blue guides, bronze celebrates, charcoal anchors.
        blue: {
          DEFAULT: "#76B9F0",
          tint: "#E7F1FC",
          action: "#2E6FB0",     // AA-contrast interactive fill
          deep: "#245A91",
        },
        bronze: {
          DEFAULT: "#AD795B",
          deep: "#8A5A3E",
          soft: "#EADFD6",
        },
        charcoal: {
          DEFAULT: "#373738",
          soft: "#5C5C5E",
        },
        paper: "#FCFBF9",       // warm white
        soft: "#F6F8FA",
        line: {
          DEFAULT: "#E8ECEF",
          soft: "#EFEDE8",
        },
        divider: "#D8DEE3",
        ok: "#3F8F6F",
      },
      fontFamily: {
        sora: ["var(--font-poppins)", "system-ui", "sans-serif"],
        manrope: ["var(--font-poppins)", "system-ui", "sans-serif"],
        poppins: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "18px",
        chip: "12px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(55,55,56,.04), 0 8px 28px rgba(55,55,56,.05)",
        lift: "0 2px 4px rgba(55,55,56,.05), 0 18px 44px rgba(46,111,176,.10)",
      },
      keyframes: {
        fade: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "none" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.22)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        fade: "fade .4s ease",
        pop: "pop .4s cubic-bezier(.2,.9,.3,1.4)",
      },
    },
  },
  plugins: [],
};

export default config;
