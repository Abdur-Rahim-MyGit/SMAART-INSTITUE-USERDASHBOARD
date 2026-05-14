import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  prefix: "",
  theme: {
    extend: {
      colors: {
        'dark-bg': '#00152e',
        'dark-card': '#002147',
        'dark-elevated': '#002a5c',
        // Corporate Palette
        navy: {
          DEFAULT: '#002147',
          light: '#002a5c', // Slightly lighter for cards
          dark: '#00152e', // Darker for footer/contrast
        },
        teal: {
          DEFAULT: '#1a3884', // Website Primary Blue
          hover: '#002147',   // Oxford Blue
          light: '#3b82f6',   // Bright Blue
        },
        gold: {
          DEFAULT: '#daa520',
          hover: '#b8860b',
          light: '#f4c430',
        },
        silver: {
          DEFAULT: '#C0C0C0',
          hover: '#A8A8A8',
          light: '#E5E4E2',
          glow: 'rgba(192, 192, 192, 0.5)',
        },
        white: {
          DEFAULT: '#ffffff',
          muted: '#e2e8f0', // Slate-200 for body text
          dim: '#94a3b8', // Slate-400 for secondary text
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      boxShadow: {
        'silver-glow': '0 0 15px rgba(192, 192, 192, 0.5)',
        'premium-silver': '0 20px 60px rgba(0,0,0,0.1), 0 0 15px rgba(192, 192, 192, 0.3)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Inter', 'system-ui', 'sans-serif'], // Keep it clean and uniform
      },
      container: {
        center: true,
        padding: "2rem",
        screens: {
          "2xl": "1400px",
        },
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
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out",
        "slide-up": "slide-up 0.8s ease-out",
      },
    }
  },
  plugins: [animate],
};
