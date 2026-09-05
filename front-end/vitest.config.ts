/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/**
 * Vitest configuration — kept separate from vite.config.ts so that
 * the heavy build-only plugins (VitePWA, ViteImageOptimizer, ONNX
 * middleware, lovable-tagger) are never loaded in the Node test
 * environment, which would cause import errors.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    // Use jsdom to provide a browser-like environment for component tests.
    environment: "jsdom",

    // Make describe / it / expect / vi available globally (no import needed).
    globals: true,

    // Run this file before each test file to set up jest-dom matchers.
    setupFiles: ["./src/test/setup.ts"],

    // Only pick up files inside src/.
    include: ["src/**/*.test.{ts,tsx,js,jsx}"],

    // Exclude heavy non-test directories.
    exclude: [
      "node_modules/**",
      "dist/**",
      "dev-dist/**",
      "public/**",
    ],

    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      all: true,
      include: ["src/**/*.{js,jsx,ts,tsx}"],
      exclude: [
        "src/**/*.test.*",
        "src/**/*.spec.*",
        "src/**/__tests__/**",
        "src/test/**",
        "src/**/*.d.ts",
      ],
    },
  },
});
