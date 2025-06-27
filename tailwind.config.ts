
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          'primary-foreground': "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          'accent-foreground': "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))"
        },
        // Health theme colors
        health: {
          primary: {
            50: "#e6f7ff",
            100: "#bae3ff",
            200: "#7cc4fa",
            300: "#47a3f3",
            400: "#2186eb",
            500: "#0967d2", // Main primary color
            600: "#0552b5",
            700: "#03449e",
            800: "#01337d",
            900: "#002159",
          },
          success: {
            50: "#e3f9e5",
            100: "#c1eac5",
            200: "#a3d9a5",
            300: "#7bc47f",
            400: "#57ae5b", // Good readings
            500: "#3f9142",
            600: "#2f8132",
            700: "#207227",
            800: "#0e5814",
            900: "#05400a",
          },
          warning: {
            50: "#fffbea",
            100: "#fff3c4",
            200: "#fce588",
            300: "#fadb5f",
            400: "#f7c948",
            500: "#f0b429", // Caution readings
            600: "#de911d",
            700: "#cb6e17",
            800: "#b44d12",
            900: "#8d2b0b",
          },
          danger: {
            50: "#ffe3e3",
            100: "#ffbdbd",
            200: "#ff9b9b",
            300: "#f86a6a",
            400: "#ef4e4e", // Critical readings
            500: "#e12d39",
            600: "#cf1124",
            700: "#ab091e",
            800: "#8a041a",
            900: "#610316",
          },
          neutral: {
            50: "#f5f7fa",
            100: "#e4e7eb",
            200: "#cbd2d9",
            300: "#9aa5b1",
            400: "#7b8794",
            500: "#616e7c",
            600: "#52606d",
            700: "#3e4c59",
            800: "#323f4b",
            900: "#1f2933",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-gentle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-gentle": "pulse-gentle 2s infinite ease-in-out",
        "float": "float 3s infinite ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
