// vite.config.ts
import { defineConfig } from "file:///C:/Users/dhars/Desktop/SMAART-INSTITUTE/SMAART-INSTITUE-USERDASHBOARD/front-end/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/dhars/Desktop/SMAART-INSTITUTE/SMAART-INSTITUE-USERDASHBOARD/front-end/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Users/dhars/Desktop/SMAART-INSTITUTE/SMAART-INSTITUE-USERDASHBOARD/front-end/node_modules/lovable-tagger/dist/index.js";
import { ViteImageOptimizer } from "file:///C:/Users/dhars/Desktop/SMAART-INSTITUTE/SMAART-INSTITUE-USERDASHBOARD/front-end/node_modules/vite-plugin-image-optimizer/dist/index.js";
import { VitePWA } from "file:///C:/Users/dhars/Desktop/SMAART-INSTITUTE/SMAART-INSTITUE-USERDASHBOARD/front-end/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\dhars\\Desktop\\SMAART-INSTITUTE\\SMAART-INSTITUE-USERDASHBOARD\\front-end";
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
      "/ws": {
        target: "ws://localhost:5000",
        ws: true
      }
    }
  },
  plugins: [
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
    include: ["@vladmandic/face-api"]
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxkaGFyc1xcXFxEZXNrdG9wXFxcXFNNQUFSVC1JTlNUSVRVVEVcXFxcU01BQVJULUlOU1RJVFVFLVVTRVJEQVNIQk9BUkRcXFxcZnJvbnQtZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxkaGFyc1xcXFxEZXNrdG9wXFxcXFNNQUFSVC1JTlNUSVRVVEVcXFxcU01BQVJULUlOU1RJVFVFLVVTRVJEQVNIQk9BUkRcXFxcZnJvbnQtZW5kXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9kaGFycy9EZXNrdG9wL1NNQUFSVC1JTlNUSVRVVEUvU01BQVJULUlOU1RJVFVFLVVTRVJEQVNIQk9BUkQvZnJvbnQtZW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcbmltcG9ydCB7IFZpdGVJbWFnZU9wdGltaXplciB9IGZyb20gJ3ZpdGUtcGx1Z2luLWltYWdlLW9wdGltaXplcic7XHJcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tICd2aXRlLXBsdWdpbi1wd2EnO1xyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogXCI6OlwiLFxyXG4gICAgcG9ydDogODA4MCxcclxuICAgIHByb3h5OiB7XHJcbiAgICAgICcvYXBpJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAwMCcsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXHJcbiAgICAgIH0sXHJcbiAgICAgICcvd3MnOiB7XHJcbiAgICAgICAgdGFyZ2V0OiAnd3M6Ly9sb2NhbGhvc3Q6NTAwMCcsXHJcbiAgICAgICAgd3M6IHRydWUsXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICBtb2RlID09PSBcImRldmVsb3BtZW50XCIgJiYgY29tcG9uZW50VGFnZ2VyKCksXHJcbiAgICBWaXRlSW1hZ2VPcHRpbWl6ZXIoe1xyXG4gICAgICB0ZXN0OiAvXFwuKGpwZT9nfHBuZ3xnaWZ8dGlmZnx3ZWJwfHN2Z3xhdmlmKSQvaSxcclxuICAgICAgZXhjbHVkZTogdW5kZWZpbmVkLFxyXG4gICAgICBpbmNsdWRlOiB1bmRlZmluZWQsXHJcbiAgICAgIGluY2x1ZGVQdWJsaWM6IHRydWUsXHJcbiAgICAgIGxvZ1N0YXRzOiB0cnVlLFxyXG4gICAgICBhbnNpQ29sb3JzOiB0cnVlLFxyXG4gICAgICBzdmc6IHtcclxuICAgICAgICBtdWx0aXBhc3M6IHRydWUsXHJcbiAgICAgICAgcGx1Z2luczogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBuYW1lOiAncHJlc2V0LWRlZmF1bHQnLFxyXG4gICAgICAgICAgICBwYXJhbXM6IHtcclxuICAgICAgICAgICAgICBvdmVycmlkZXM6IHtcclxuICAgICAgICAgICAgICAgIGNsZWFudXBJZHM6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgcmVtb3ZlVmlld0JveDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICAnc29ydEF0dHJzJyxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgbmFtZTogJ2FkZEF0dHJpYnV0ZXNUb1NWR0VsZW1lbnQnLFxyXG4gICAgICAgICAgICBwYXJhbXM6IHtcclxuICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiBbeyB4bWxuczogJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJyB9XSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgfSxcclxuICAgICAgcG5nOiB7XHJcbiAgICAgICAgcXVhbGl0eTogODAsXHJcbiAgICAgIH0sXHJcbiAgICAgIGpwZWc6IHtcclxuICAgICAgICBxdWFsaXR5OiA4MCxcclxuICAgICAgfSxcclxuICAgICAganBnOiB7XHJcbiAgICAgICAgcXVhbGl0eTogODAsXHJcbiAgICAgIH0sXHJcbiAgICAgIHdlYnA6IHtcclxuICAgICAgICBsb3NzbGVzczogdHJ1ZSxcclxuICAgICAgfSxcclxuICAgIH0pLFxyXG4gICAgVml0ZVBXQSh7XHJcbiAgICAgIHJlZ2lzdGVyVHlwZTogJ2F1dG9VcGRhdGUnLFxyXG4gICAgICBpbmplY3RSZWdpc3RlcjogJ2F1dG8nLFxyXG4gICAgICBpbmNsdWRlQXNzZXRzOiBbJ2Zhdmljb24ucG5nJywgJ2xvZ28ucG5nJywgJ3B3YS0xOTJ4MTkyLnBuZycsICdwd2EtNTEyeDUxMi5wbmcnXSxcclxuICAgICAgbWFuaWZlc3Q6IHtcclxuICAgICAgICBuYW1lOiAnU01BQVJUIEluc3RpdHV0ZSBVc2VyIERhc2hib2FyZCcsXHJcbiAgICAgICAgc2hvcnRfbmFtZTogJ1NNQUFSVCBEYXNoYm9hcmQnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU3R1ZGVudCBhbmQgVXNlciBEYXNoYm9hcmQgZm9yIFNNQUFSVCBJbnN0aXR1dGUnLFxyXG4gICAgICAgIHRoZW1lX2NvbG9yOiAnIzFhMzg4NCcsXHJcbiAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogJyNmZmZmZmYnLFxyXG4gICAgICAgIGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcclxuICAgICAgICBpY29uczogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6ICdmYXZpY29uLnBuZycsXHJcbiAgICAgICAgICAgIHNpemVzOiAnMTkyeDE5MicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6ICdmYXZpY29uLnBuZycsXHJcbiAgICAgICAgICAgIHNpemVzOiAnNTEyeDUxMicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6ICdmYXZpY29uLnBuZycsXHJcbiAgICAgICAgICAgIHNpemVzOiAnNTEyeDUxMicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxyXG4gICAgICAgICAgICBwdXJwb3NlOiAnYW55IG1hc2thYmxlJ1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIF1cclxuICAgICAgfSxcclxuICAgICAgd29ya2JveDoge1xyXG4gICAgICAgIGdsb2JQYXR0ZXJuczogWycqKi8qLntqcyxjc3MsaHRtbCxpY28scG5nLHN2Zyx3ZWJwfSddLFxyXG4gICAgICAgIG1heGltdW1GaWxlU2l6ZVRvQ2FjaGVJbkJ5dGVzOiAxNSAqIDEwMjQgKiAxMDI0XHJcbiAgICAgIH0sXHJcbiAgICAgIGRldk9wdGlvbnM6IHtcclxuICAgICAgICBlbmFibGVkOiBmYWxzZVxyXG4gICAgICB9XHJcbiAgICB9KSxcclxuICBdLmZpbHRlcihCb29sZWFuKSxcclxuICBlc2J1aWxkOiB7XHJcbiAgICBkcm9wOiBtb2RlID09PSBcInByb2R1Y3Rpb25cIiA/IFtcImNvbnNvbGVcIiwgXCJkZWJ1Z2dlclwiXSA6IFtdLFxyXG4gIH0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICBpbmNsdWRlOiBbXCJAdmxhZG1hbmRpYy9mYWNlLWFwaVwiXSxcclxuICB9LFxyXG59KSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNmEsU0FBUyxvQkFBb0I7QUFDMWMsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLDBCQUEwQjtBQUNuQyxTQUFTLGVBQWU7QUFMeEIsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsTUFDVjtBQUFBLE1BQ0EsT0FBTztBQUFBLFFBQ0wsUUFBUTtBQUFBLFFBQ1IsSUFBSTtBQUFBLE1BQ047QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sU0FBUyxpQkFBaUIsZ0JBQWdCO0FBQUEsSUFDMUMsbUJBQW1CO0FBQUEsTUFDakIsTUFBTTtBQUFBLE1BQ04sU0FBUztBQUFBLE1BQ1QsU0FBUztBQUFBLE1BQ1QsZUFBZTtBQUFBLE1BQ2YsVUFBVTtBQUFBLE1BQ1YsWUFBWTtBQUFBLE1BQ1osS0FBSztBQUFBLFFBQ0gsV0FBVztBQUFBLFFBQ1gsU0FBUztBQUFBLFVBQ1A7QUFBQSxZQUNFLE1BQU07QUFBQSxZQUNOLFFBQVE7QUFBQSxjQUNOLFdBQVc7QUFBQSxnQkFDVCxZQUFZO0FBQUEsZ0JBQ1osZUFBZTtBQUFBLGNBQ2pCO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFlBQ0UsTUFBTTtBQUFBLFlBQ04sUUFBUTtBQUFBLGNBQ04sWUFBWSxDQUFDLEVBQUUsT0FBTyw2QkFBNkIsQ0FBQztBQUFBLFlBQ3REO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsTUFDQSxLQUFLO0FBQUEsUUFDSCxTQUFTO0FBQUEsTUFDWDtBQUFBLE1BQ0EsTUFBTTtBQUFBLFFBQ0osU0FBUztBQUFBLE1BQ1g7QUFBQSxNQUNBLEtBQUs7QUFBQSxRQUNILFNBQVM7QUFBQSxNQUNYO0FBQUEsTUFDQSxNQUFNO0FBQUEsUUFDSixVQUFVO0FBQUEsTUFDWjtBQUFBLElBQ0YsQ0FBQztBQUFBLElBQ0QsUUFBUTtBQUFBLE1BQ04sY0FBYztBQUFBLE1BQ2QsZ0JBQWdCO0FBQUEsTUFDaEIsZUFBZSxDQUFDLGVBQWUsWUFBWSxtQkFBbUIsaUJBQWlCO0FBQUEsTUFDL0UsVUFBVTtBQUFBLFFBQ1IsTUFBTTtBQUFBLFFBQ04sWUFBWTtBQUFBLFFBQ1osYUFBYTtBQUFBLFFBQ2IsYUFBYTtBQUFBLFFBQ2Isa0JBQWtCO0FBQUEsUUFDbEIsU0FBUztBQUFBLFFBQ1QsT0FBTztBQUFBLFVBQ0w7QUFBQSxZQUNFLEtBQUs7QUFBQSxZQUNMLE9BQU87QUFBQSxZQUNQLE1BQU07QUFBQSxVQUNSO0FBQUEsVUFDQTtBQUFBLFlBQ0UsS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFVBQ1I7QUFBQSxVQUNBO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsWUFDTixTQUFTO0FBQUEsVUFDWDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsTUFDQSxTQUFTO0FBQUEsUUFDUCxjQUFjLENBQUMscUNBQXFDO0FBQUEsUUFDcEQsK0JBQStCLEtBQUssT0FBTztBQUFBLE1BQzdDO0FBQUEsTUFDQSxZQUFZO0FBQUEsUUFDVixTQUFTO0FBQUEsTUFDWDtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0gsRUFBRSxPQUFPLE9BQU87QUFBQSxFQUNoQixTQUFTO0FBQUEsSUFDUCxNQUFNLFNBQVMsZUFBZSxDQUFDLFdBQVcsVUFBVSxJQUFJLENBQUM7QUFBQSxFQUMzRDtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLHNCQUFzQjtBQUFBLEVBQ2xDO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
