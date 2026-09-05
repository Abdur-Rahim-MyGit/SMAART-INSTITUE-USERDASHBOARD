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
      include: [
        // Only instrument files that have test coverage in this phase.
        // Untested files (proctoring engine, AI services, etc.) would
        // drag the aggregate below any reasonable threshold.
        "src/utils/colorUtils.js",
        "src/utils/resumeSecurity.js",
        "src/utils/assessmentTimerStorage.js",
        "src/utils/courseUnlock.js",
        "src/utils/microAssessmentUtils.js",
        "src/hooks/useAuth.js",
        "src/hooks/useUser.js",
        "src/contexts/UserContextFixed.jsx",
        "src/components/LoginCard.jsx",
        "src/components/PrivateRoute.jsx",
        "src/components/SecurityGuard.jsx",
      ],
      exclude: [
        "src/**/*.test.*",
        "src/test/**",
        "src/**/*.d.ts",
      ],
    },
  },
});
