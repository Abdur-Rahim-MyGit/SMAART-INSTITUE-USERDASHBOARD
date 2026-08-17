// vite.config.ts
import { defineConfig } from "file:///C:/Users/dhars/Desktop/SMAART-INSTITUTE/SMAART-INSTITUE-USERDASHBOARD/front-end/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/dhars/Desktop/SMAART-INSTITUTE/SMAART-INSTITUE-USERDASHBOARD/front-end/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Users/dhars/Desktop/SMAART-INSTITUTE/SMAART-INSTITUE-USERDASHBOARD/front-end/node_modules/lovable-tagger/dist/index.js";
import { ViteImageOptimizer } from "file:///C:/Users/dhars/Desktop/SMAART-INSTITUTE/SMAART-INSTITUE-USERDASHBOARD/front-end/node_modules/vite-plugin-image-optimizer/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\dhars\\Desktop\\SMAART-INSTITUTE\\SMAART-INSTITUE-USERDASHBOARD\\front-end";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080
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
    })
  ].filter(Boolean),
  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : []
  },
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxkaGFyc1xcXFxEZXNrdG9wXFxcXFNNQUFSVC1JTlNUSVRVVEVcXFxcU01BQVJULUlOU1RJVFVFLVVTRVJEQVNIQk9BUkRcXFxcZnJvbnQtZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxkaGFyc1xcXFxEZXNrdG9wXFxcXFNNQUFSVC1JTlNUSVRVVEVcXFxcU01BQVJULUlOU1RJVFVFLVVTRVJEQVNIQk9BUkRcXFxcZnJvbnQtZW5kXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9kaGFycy9EZXNrdG9wL1NNQUFSVC1JTlNUSVRVVEUvU01BQVJULUlOU1RJVFVFLVVTRVJEQVNIQk9BUkQvZnJvbnQtZW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcbmltcG9ydCB7IFZpdGVJbWFnZU9wdGltaXplciB9IGZyb20gJ3ZpdGUtcGx1Z2luLWltYWdlLW9wdGltaXplcic7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogXCI6OlwiLFxyXG4gICAgcG9ydDogODA4MCxcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICBtb2RlID09PSBcImRldmVsb3BtZW50XCIgJiYgY29tcG9uZW50VGFnZ2VyKCksXHJcbiAgICBWaXRlSW1hZ2VPcHRpbWl6ZXIoe1xyXG4gICAgICB0ZXN0OiAvXFwuKGpwZT9nfHBuZ3xnaWZ8dGlmZnx3ZWJwfHN2Z3xhdmlmKSQvaSxcclxuICAgICAgZXhjbHVkZTogdW5kZWZpbmVkLFxyXG4gICAgICBpbmNsdWRlOiB1bmRlZmluZWQsXHJcbiAgICAgIGluY2x1ZGVQdWJsaWM6IHRydWUsXHJcbiAgICAgIGxvZ1N0YXRzOiB0cnVlLFxyXG4gICAgICBhbnNpQ29sb3JzOiB0cnVlLFxyXG4gICAgICBzdmc6IHtcclxuICAgICAgICBtdWx0aXBhc3M6IHRydWUsXHJcbiAgICAgICAgcGx1Z2luczogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBuYW1lOiAncHJlc2V0LWRlZmF1bHQnLFxyXG4gICAgICAgICAgICBwYXJhbXM6IHtcclxuICAgICAgICAgICAgICBvdmVycmlkZXM6IHtcclxuICAgICAgICAgICAgICAgIGNsZWFudXBJZHM6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgcmVtb3ZlVmlld0JveDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICAnc29ydEF0dHJzJyxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgbmFtZTogJ2FkZEF0dHJpYnV0ZXNUb1NWR0VsZW1lbnQnLFxyXG4gICAgICAgICAgICBwYXJhbXM6IHtcclxuICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiBbeyB4bWxuczogJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJyB9XSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgfSxcclxuICAgICAgcG5nOiB7XHJcbiAgICAgICAgcXVhbGl0eTogODAsXHJcbiAgICAgIH0sXHJcbiAgICAgIGpwZWc6IHtcclxuICAgICAgICBxdWFsaXR5OiA4MCxcclxuICAgICAgfSxcclxuICAgICAganBnOiB7XHJcbiAgICAgICAgcXVhbGl0eTogODAsXHJcbiAgICAgIH0sXHJcbiAgICAgIHdlYnA6IHtcclxuICAgICAgICBsb3NzbGVzczogdHJ1ZSxcclxuICAgICAgfSxcclxuICAgIH0pLFxyXG4gIF0uZmlsdGVyKEJvb2xlYW4pLFxyXG4gIGVzYnVpbGQ6IHtcclxuICAgIGRyb3A6IG1vZGUgPT09IFwicHJvZHVjdGlvblwiID8gW1wiY29uc29sZVwiLCBcImRlYnVnZ2VyXCJdIDogW10sXHJcbiAgfSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxufSkpO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTZhLFNBQVMsb0JBQW9CO0FBQzFjLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUywwQkFBMEI7QUFKbkMsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sU0FBUyxpQkFBaUIsZ0JBQWdCO0FBQUEsSUFDMUMsbUJBQW1CO0FBQUEsTUFDakIsTUFBTTtBQUFBLE1BQ04sU0FBUztBQUFBLE1BQ1QsU0FBUztBQUFBLE1BQ1QsZUFBZTtBQUFBLE1BQ2YsVUFBVTtBQUFBLE1BQ1YsWUFBWTtBQUFBLE1BQ1osS0FBSztBQUFBLFFBQ0gsV0FBVztBQUFBLFFBQ1gsU0FBUztBQUFBLFVBQ1A7QUFBQSxZQUNFLE1BQU07QUFBQSxZQUNOLFFBQVE7QUFBQSxjQUNOLFdBQVc7QUFBQSxnQkFDVCxZQUFZO0FBQUEsZ0JBQ1osZUFBZTtBQUFBLGNBQ2pCO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFlBQ0UsTUFBTTtBQUFBLFlBQ04sUUFBUTtBQUFBLGNBQ04sWUFBWSxDQUFDLEVBQUUsT0FBTyw2QkFBNkIsQ0FBQztBQUFBLFlBQ3REO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsTUFDQSxLQUFLO0FBQUEsUUFDSCxTQUFTO0FBQUEsTUFDWDtBQUFBLE1BQ0EsTUFBTTtBQUFBLFFBQ0osU0FBUztBQUFBLE1BQ1g7QUFBQSxNQUNBLEtBQUs7QUFBQSxRQUNILFNBQVM7QUFBQSxNQUNYO0FBQUEsTUFDQSxNQUFNO0FBQUEsUUFDSixVQUFVO0FBQUEsTUFDWjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0gsRUFBRSxPQUFPLE9BQU87QUFBQSxFQUNoQixTQUFTO0FBQUEsSUFDUCxNQUFNLFNBQVMsZUFBZSxDQUFDLFdBQVcsVUFBVSxJQUFJLENBQUM7QUFBQSxFQUMzRDtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
