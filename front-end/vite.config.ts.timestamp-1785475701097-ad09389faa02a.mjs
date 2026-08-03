// vite.config.ts
import { defineConfig } from "file:///C:/Users/Rashad/Documents/SMAART-INSTITUE-USERDASHBOARD/front-end/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Rashad/Documents/SMAART-INSTITUE-USERDASHBOARD/front-end/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import fs from "fs";
import { componentTagger } from "file:///C:/Users/Rashad/Documents/SMAART-INSTITUE-USERDASHBOARD/front-end/node_modules/lovable-tagger/dist/index.js";
import { ViteImageOptimizer } from "file:///C:/Users/Rashad/Documents/SMAART-INSTITUE-USERDASHBOARD/front-end/node_modules/vite-plugin-image-optimizer/dist/index.js";
import { VitePWA } from "file:///C:/Users/Rashad/Documents/SMAART-INSTITUE-USERDASHBOARD/front-end/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\Rashad\\Documents\\SMAART-INSTITUE-USERDASHBOARD\\front-end";
var serveOnnxRuntimeAssets = () => ({
  name: "serve-onnx-runtime-assets",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = (req.url || "").split("?")[0];
      if (url.startsWith("/onnx-wasm/") && (url.endsWith(".mjs") || url.endsWith(".wasm"))) {
        const filePath = path.join(__vite_injected_original_dirname, "public", url);
        try {
          if (fs.existsSync(filePath)) {
            res.setHeader(
              "Content-Type",
              url.endsWith(".wasm") ? "application/wasm" : "text/javascript"
            );
            res.setHeader("Cache-Control", "no-cache");
            fs.createReadStream(filePath).pipe(res);
            return;
          }
        } catch (_) {
        }
      }
      next();
    });
  }
});
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false
      },
      "/socket.io": {
        target: "ws://localhost:5000",
        ws: true,
        changeOrigin: true
      },
      "/ws": {
        target: "ws://localhost:5000",
        ws: true
      }
    }
  },
  plugins: [
    serveOnnxRuntimeAssets(),
    react(),
    mode === "development" && componentTagger(),
    ViteImageOptimizer({
      test: /\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i,
      exclude: void 0,
      include: void 0,
      includePublic: true,
      logStats: true,
      ansiColors: true,
      svg: {
        multipass: true,
        plugins: [
          {
            name: "preset-default",
            params: {
              overrides: {
                cleanupIds: false,
                removeViewBox: false
              }
            }
          },
          "sortAttrs",
          {
            name: "addAttributesToSVGElement",
            params: {
              attributes: [{ xmlns: "http://www.w3.org/2000/svg" }]
            }
          }
        ]
      },
      png: {
        quality: 80
      },
      jpeg: {
        quality: 80
      },
      jpg: {
        quality: 80
      },
      webp: {
        lossless: true
      }
    }),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.png", "logo.png", "pwa-192x192.png", "pwa-512x512.png"],
      manifest: {
        name: "SMAART Institute User Dashboard",
        short_name: "SMAART Dashboard",
        description: "Student and User Dashboard for SMAART Institute",
        theme_color: "#1a3884",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "favicon.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "favicon.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "favicon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024
      },
      devOptions: {
        enabled: false
      }
    })
  ].filter(Boolean),
  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : []
  },
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  optimizeDeps: {
    include: ["@vladmandic/face-api"],
    exclude: ["onnxruntime-web"]
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxSYXNoYWRcXFxcRG9jdW1lbnRzXFxcXFNNQUFSVC1JTlNUSVRVRS1VU0VSREFTSEJPQVJEXFxcXGZyb250LWVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcUmFzaGFkXFxcXERvY3VtZW50c1xcXFxTTUFBUlQtSU5TVElUVUUtVVNFUkRBU0hCT0FSRFxcXFxmcm9udC1lbmRcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL1Jhc2hhZC9Eb2N1bWVudHMvU01BQVJULUlOU1RJVFVFLVVTRVJEQVNIQk9BUkQvZnJvbnQtZW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xyXG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcclxuaW1wb3J0IHsgVml0ZUltYWdlT3B0aW1pemVyIH0gZnJvbSAndml0ZS1wbHVnaW4taW1hZ2Utb3B0aW1pemVyJztcclxuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXB3YSc7XHJcblxyXG4vLyBvbm54cnVudGltZS13ZWIgKGxvYWRlZCB2aWEgPHNjcmlwdCBzcmM9XCIvb25ueC13YXNtL29ydC5taW4uanNcIj4pIHJlc29sdmVzIGl0c1xyXG4vLyB3YXNtIGJhY2tlbmQgYXQgcnVudGltZSB3aXRoIGEgZHluYW1pYyBpbXBvcnQoKSBvZiBlLmcuXHJcbi8vIC9vbm54LXdhc20vb3J0LXdhc20tc2ltZC10aHJlYWRlZC5qc2VwLm1qcy4gVGhvc2UgZmlsZXMgbGl2ZSBpbiAvcHVibGljLCBhbmRcclxuLy8gVml0ZSdzIGRldiBzZXJ2ZXIgcmVmdXNlcyB0byBpbXBvcnQgYSBwdWJsaWMgZmlsZSB0aHJvdWdoIHRoZSBtb2R1bGUgZ3JhcGhcclxuLy8gKFwiXHUyMDI2IHNob3VsZCBub3QgYmUgaW1wb3J0ZWQgZnJvbSBzb3VyY2UgY29kZVwiKS4gVGhpcyBkZXYtb25seSBtaWRkbGV3YXJlIHNlcnZlc1xyXG4vLyB0aGUgT1JUIHJ1bnRpbWUgYXNzZXRzIHJhdywgQkVGT1JFIFZpdGUncyB0cmFuc2Zvcm0gbWlkZGxld2FyZSBydW5zLCBzbyB0aGVcclxuLy8gaW1wb3J0KCkgZ2V0cyBhIHZhbGlkIG1vZHVsZS4gUHJvZHVjdGlvbiBidWlsZHMgc2VydmUgL3B1YmxpYyBzdGF0aWNhbGx5IGFuZFxyXG4vLyBuZXZlciBoaXQgdGhpcyBwYXRoLlxyXG5jb25zdCBzZXJ2ZU9ubnhSdW50aW1lQXNzZXRzID0gKCkgPT4gKHtcclxuICBuYW1lOiBcInNlcnZlLW9ubngtcnVudGltZS1hc3NldHNcIixcclxuICBhcHBseTogXCJzZXJ2ZVwiIGFzIGNvbnN0LFxyXG4gIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXI6IGFueSkge1xyXG4gICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgocmVxOiBhbnksIHJlczogYW55LCBuZXh0OiBhbnkpID0+IHtcclxuICAgICAgY29uc3QgdXJsID0gKHJlcS51cmwgfHwgXCJcIikuc3BsaXQoXCI/XCIpWzBdO1xyXG4gICAgICBpZiAodXJsLnN0YXJ0c1dpdGgoXCIvb25ueC13YXNtL1wiKSAmJiAodXJsLmVuZHNXaXRoKFwiLm1qc1wiKSB8fCB1cmwuZW5kc1dpdGgoXCIud2FzbVwiKSkpIHtcclxuICAgICAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsIFwicHVibGljXCIsIHVybCk7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGZpbGVQYXRoKSkge1xyXG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKFxyXG4gICAgICAgICAgICAgIFwiQ29udGVudC1UeXBlXCIsXHJcbiAgICAgICAgICAgICAgdXJsLmVuZHNXaXRoKFwiLndhc21cIikgPyBcImFwcGxpY2F0aW9uL3dhc21cIiA6IFwidGV4dC9qYXZhc2NyaXB0XCJcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcihcIkNhY2hlLUNvbnRyb2xcIiwgXCJuby1jYWNoZVwiKTtcclxuICAgICAgICAgICAgZnMuY3JlYXRlUmVhZFN0cmVhbShmaWxlUGF0aCkucGlwZShyZXMpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCAoXykge1xyXG4gICAgICAgICAgLyogZmFsbCB0aHJvdWdoIHRvIFZpdGUgKi9cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgbmV4dCgpO1xyXG4gICAgfSk7XHJcbiAgfSxcclxufSk7XHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XHJcbiAgc2VydmVyOiB7XHJcbiAgICBob3N0OiBcIjo6XCIsXHJcbiAgICBwb3J0OiA4MDgwLFxyXG4gICAgcHJveHk6IHtcclxuICAgICAgJy9hcGknOiB7XHJcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo1MDAwJyxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcclxuICAgICAgfSxcclxuICAgICAgJy9zb2NrZXQuaW8nOiB7XHJcbiAgICAgICAgdGFyZ2V0OiAnd3M6Ly9sb2NhbGhvc3Q6NTAwMCcsXHJcbiAgICAgICAgd3M6IHRydWUsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgICAnL3dzJzoge1xyXG4gICAgICAgIHRhcmdldDogJ3dzOi8vbG9jYWxob3N0OjUwMDAnLFxyXG4gICAgICAgIHdzOiB0cnVlLFxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuICBwbHVnaW5zOiBbXHJcbiAgICBzZXJ2ZU9ubnhSdW50aW1lQXNzZXRzKCksXHJcbiAgICByZWFjdCgpLFxyXG4gICAgbW9kZSA9PT0gXCJkZXZlbG9wbWVudFwiICYmIGNvbXBvbmVudFRhZ2dlcigpLFxyXG4gICAgVml0ZUltYWdlT3B0aW1pemVyKHtcclxuICAgICAgdGVzdDogL1xcLihqcGU/Z3xwbmd8Z2lmfHRpZmZ8d2VicHxzdmd8YXZpZikkL2ksXHJcbiAgICAgIGV4Y2x1ZGU6IHVuZGVmaW5lZCxcclxuICAgICAgaW5jbHVkZTogdW5kZWZpbmVkLFxyXG4gICAgICBpbmNsdWRlUHVibGljOiB0cnVlLFxyXG4gICAgICBsb2dTdGF0czogdHJ1ZSxcclxuICAgICAgYW5zaUNvbG9yczogdHJ1ZSxcclxuICAgICAgc3ZnOiB7XHJcbiAgICAgICAgbXVsdGlwYXNzOiB0cnVlLFxyXG4gICAgICAgIHBsdWdpbnM6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgbmFtZTogJ3ByZXNldC1kZWZhdWx0JyxcclxuICAgICAgICAgICAgcGFyYW1zOiB7XHJcbiAgICAgICAgICAgICAgb3ZlcnJpZGVzOiB7XHJcbiAgICAgICAgICAgICAgICBjbGVhbnVwSWRzOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHJlbW92ZVZpZXdCb3g6IGZhbHNlLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgJ3NvcnRBdHRycycsXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIG5hbWU6ICdhZGRBdHRyaWJ1dGVzVG9TVkdFbGVtZW50JyxcclxuICAgICAgICAgICAgcGFyYW1zOiB7XHJcbiAgICAgICAgICAgICAgYXR0cmlidXRlczogW3sgeG1sbnM6ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycgfV0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgIH0sXHJcbiAgICAgIHBuZzoge1xyXG4gICAgICAgIHF1YWxpdHk6IDgwLFxyXG4gICAgICB9LFxyXG4gICAgICBqcGVnOiB7XHJcbiAgICAgICAgcXVhbGl0eTogODAsXHJcbiAgICAgIH0sXHJcbiAgICAgIGpwZzoge1xyXG4gICAgICAgIHF1YWxpdHk6IDgwLFxyXG4gICAgICB9LFxyXG4gICAgICB3ZWJwOiB7XHJcbiAgICAgICAgbG9zc2xlc3M6IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICB9KSxcclxuICAgIFZpdGVQV0Eoe1xyXG4gICAgICByZWdpc3RlclR5cGU6ICdhdXRvVXBkYXRlJyxcclxuICAgICAgaW5qZWN0UmVnaXN0ZXI6ICdhdXRvJyxcclxuICAgICAgaW5jbHVkZUFzc2V0czogWydmYXZpY29uLnBuZycsICdsb2dvLnBuZycsICdwd2EtMTkyeDE5Mi5wbmcnLCAncHdhLTUxMng1MTIucG5nJ10sXHJcbiAgICAgIG1hbmlmZXN0OiB7XHJcbiAgICAgICAgbmFtZTogJ1NNQUFSVCBJbnN0aXR1dGUgVXNlciBEYXNoYm9hcmQnLFxyXG4gICAgICAgIHNob3J0X25hbWU6ICdTTUFBUlQgRGFzaGJvYXJkJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ1N0dWRlbnQgYW5kIFVzZXIgRGFzaGJvYXJkIGZvciBTTUFBUlQgSW5zdGl0dXRlJyxcclxuICAgICAgICB0aGVtZV9jb2xvcjogJyMxYTM4ODQnLFxyXG4gICAgICAgIGJhY2tncm91bmRfY29sb3I6ICcjZmZmZmZmJyxcclxuICAgICAgICBkaXNwbGF5OiAnc3RhbmRhbG9uZScsXHJcbiAgICAgICAgaWNvbnM6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgc3JjOiAnZmF2aWNvbi5wbmcnLFxyXG4gICAgICAgICAgICBzaXplczogJzE5MngxOTInLFxyXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJ1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgc3JjOiAnZmF2aWNvbi5wbmcnLFxyXG4gICAgICAgICAgICBzaXplczogJzUxMng1MTInLFxyXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJ1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgc3JjOiAnZmF2aWNvbi5wbmcnLFxyXG4gICAgICAgICAgICBzaXplczogJzUxMng1MTInLFxyXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcclxuICAgICAgICAgICAgcHVycG9zZTogJ2FueSBtYXNrYWJsZSdcclxuICAgICAgICAgIH1cclxuICAgICAgICBdXHJcbiAgICAgIH0sXHJcbiAgICAgIHdvcmtib3g6IHtcclxuICAgICAgICBnbG9iUGF0dGVybnM6IFsnKiovKi57anMsY3NzLGh0bWwsaWNvLHBuZyxzdmcsd2VicH0nXSxcclxuICAgICAgICBtYXhpbXVtRmlsZVNpemVUb0NhY2hlSW5CeXRlczogMTUgKiAxMDI0ICogMTAyNFxyXG4gICAgICB9LFxyXG4gICAgICBkZXZPcHRpb25zOiB7XHJcbiAgICAgICAgZW5hYmxlZDogZmFsc2VcclxuICAgICAgfVxyXG4gICAgfSksXHJcbiAgXS5maWx0ZXIoQm9vbGVhbiksXHJcbiAgZXNidWlsZDoge1xyXG4gICAgZHJvcDogbW9kZSA9PT0gXCJwcm9kdWN0aW9uXCIgPyBbXCJjb25zb2xlXCIsIFwiZGVidWdnZXJcIl0gOiBbXSxcclxuICB9LFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIG9wdGltaXplRGVwczoge1xyXG4gICAgaW5jbHVkZTogW1wiQHZsYWRtYW5kaWMvZmFjZS1hcGlcIl0sXHJcbiAgICBleGNsdWRlOiBbXCJvbm54cnVudGltZS13ZWJcIl1cclxuICB9LFxyXG59KSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBaVksU0FBUyxvQkFBb0I7QUFDOVosT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixPQUFPLFFBQVE7QUFDZixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLDBCQUEwQjtBQUNuQyxTQUFTLGVBQWU7QUFOeEIsSUFBTSxtQ0FBbUM7QUFnQnpDLElBQU0seUJBQXlCLE9BQU87QUFBQSxFQUNwQyxNQUFNO0FBQUEsRUFDTixPQUFPO0FBQUEsRUFDUCxnQkFBZ0IsUUFBYTtBQUMzQixXQUFPLFlBQVksSUFBSSxDQUFDLEtBQVUsS0FBVSxTQUFjO0FBQ3hELFlBQU0sT0FBTyxJQUFJLE9BQU8sSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQ3hDLFVBQUksSUFBSSxXQUFXLGFBQWEsTUFBTSxJQUFJLFNBQVMsTUFBTSxLQUFLLElBQUksU0FBUyxPQUFPLElBQUk7QUFDcEYsY0FBTSxXQUFXLEtBQUssS0FBSyxrQ0FBVyxVQUFVLEdBQUc7QUFDbkQsWUFBSTtBQUNGLGNBQUksR0FBRyxXQUFXLFFBQVEsR0FBRztBQUMzQixnQkFBSTtBQUFBLGNBQ0Y7QUFBQSxjQUNBLElBQUksU0FBUyxPQUFPLElBQUkscUJBQXFCO0FBQUEsWUFDL0M7QUFDQSxnQkFBSSxVQUFVLGlCQUFpQixVQUFVO0FBQ3pDLGVBQUcsaUJBQWlCLFFBQVEsRUFBRSxLQUFLLEdBQUc7QUFDdEM7QUFBQSxVQUNGO0FBQUEsUUFDRixTQUFTLEdBQUc7QUFBQSxRQUVaO0FBQUEsTUFDRjtBQUNBLFdBQUs7QUFBQSxJQUNQLENBQUM7QUFBQSxFQUNIO0FBQ0Y7QUFFQSxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztB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
