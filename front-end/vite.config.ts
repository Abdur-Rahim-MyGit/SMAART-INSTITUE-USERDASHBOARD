import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { VitePWA } from 'vite-plugin-pwa';

// onnxruntime-web (loaded via <script src="/onnx-wasm/ort.min.js">) resolves its
// wasm backend at runtime with a dynamic import() of e.g.
// /onnx-wasm/ort-wasm-simd-threaded.jsep.mjs. Those files live in /public, and
// Vite's dev server refuses to import a public file through the module graph
// ("… should not be imported from source code"). This dev-only middleware serves
// the ORT runtime assets raw, BEFORE Vite's transform middleware runs, so the
// import() gets a valid module. Production builds serve /public statically and
// never hit this path.
const serveOnnxRuntimeAssets = () => ({
  name: "serve-onnx-runtime-assets",
  apply: "serve" as const,
  configureServer(server: any) {
    const contentTypeFor = (url: string) => {
      if (url.endsWith(".wasm")) return "application/wasm";
      if (url.endsWith(".mjs") || url.endsWith(".js")) return "text/javascript";
      if (url.endsWith(".task") || url.endsWith(".data") || url.endsWith(".bin")) return "application/octet-stream";
      return null;
    };
    server.middlewares.use((req: any, res: any, next: any) => {
      const url = (req.url || "").split("?")[0];
      // The AI worker loads two families of raw runtime assets that must be
      // streamed as-is BEFORE Vite's transform middleware touches them:
      //  - /onnx-wasm/*  (ONNX Runtime WASM/JSEP backend, dynamic import())
      //  - /mediapipe/*  (MediaPipe tasks-vision wasm fileset + .task model)
      const isOnnx = url.startsWith("/onnx-wasm/") && (url.endsWith(".mjs") || url.endsWith(".wasm"));
      const isMediaPipe = url.startsWith("/mediapipe/");
      if (isOnnx || isMediaPipe) {
        const ct = contentTypeFor(url);
        const filePath = path.join(__dirname, "public", url);
        try {
          if (ct && fs.existsSync(filePath)) {
            res.setHeader("Content-Type", ct);
            res.setHeader("Cache-Control", "no-cache");
            fs.createReadStream(filePath).pipe(res);
            return;
          }
        } catch (_) {
          /* fall through to Vite */
        }
      }
      next();
    });
  },
});
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Stamped into the bundle at build time and shown in the proctoring panel.
  // A service worker can keep serving a previous bundle long after a rebuild,
  // and without a visible marker there is no way to tell a fix that did not
  // work from a fix that never loaded — which is a genuinely expensive thing
  // to be unsure about while testing.
  define: {
    __BUILD_STAMP__: JSON.stringify(
      new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    ),
  },
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'ws://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:5000',
        ws: true,
      }
    }
  },
  plugins: [
    serveOnnxRuntimeAssets(),
    react(),
    mode === "development" && componentTagger(),
    ViteImageOptimizer({
      test: /\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i,
      exclude: undefined,
      include: undefined,
      includePublic: true,
      logStats: true,
      ansiColors: true,
      svg: {
        multipass: true,
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                cleanupIds: false,
                removeViewBox: false,
              },
            },
          },
          'sortAttrs',
          {
            name: 'addAttributesToSVGElement',
            params: {
              attributes: [{ xmlns: 'http://www.w3.org/2000/svg' }],
            },
          },
        ],
      },
      png: {
        quality: 80,
      },
      jpeg: {
        quality: 80,
      },
      jpg: {
        quality: 80,
      },
      webp: {
        lossless: true,
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.png', 'logo.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'SMAART Institute User Dashboard',
        short_name: 'SMAART Dashboard',
        description: 'Student and User Dashboard for SMAART Institute',
        theme_color: '#1a3884',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        // These four are already precached (with their own revision hash) via
        // includeAssets above. Without this, the glob scan above also matches
        // them in dist/ and adds a second precache entry with a DIFFERENT
        // hash for the same URL, which throws
        // "add-to-cache-list-conflicting-entries" at service-worker install.
        globIgnores: ['favicon.png', 'logo.png', 'pwa-192x192.png', 'pwa-512x512.png'],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        // Without these the new worker installs but sits in "waiting" until
        // every tab for this origin is closed, so a deploy keeps serving the
        // previous bundle from cache -- a hard refresh does not help, because
        // the worker answers the request before the network is consulted.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // index.html must always come from the network, otherwise the cached
        // copy keeps pointing at the previous hashed asset filenames.
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: { cacheName: 'html-cache' }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    }),
  ].filter(Boolean),
  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["@vladmandic/face-api"],
    exclude: ["onnxruntime-web"]
  },
}));
