# Stage 1: Build the Vite/React application
FROM node:22-alpine AS build
WORKDIR /app
# .npmrc must come along — it carries legacy-peer-deps=true, without which
# npm ci fails on React 19 vs packages whose peer range stops at React 18.
COPY package*.json .npmrc ./
RUN npm ci
COPY . .
# The backend's address is baked into the static build at this point.
# Leave unset for local Docker — the code then falls back to
# http://localhost:5000, which matches the local compose stack. For AWS:
#   docker compose build --build-arg VITE_API_URL=https://api.<your-domain>/api
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
# Admin/employer portal origin. Empty locally (the app falls back to the
# current origin); set to the admin host for production builds.
ARG VITE_ADMIN_URL
ENV VITE_ADMIN_URL=$VITE_ADMIN_URL
RUN npm run build
# The AI proctoring loads the ONNX Runtime from /onnx-wasm/. Those files are
# gitignored (large binaries) but ship inside the onnxruntime-web package, so
# stage them into the build output here instead of relying on public/.
RUN mkdir -p dist/onnx-wasm && cp node_modules/onnxruntime-web/dist/* dist/onnx-wasm/

# Stage 2: Serve the static build with Nginx
FROM nginx:alpine
# Pull in Alpine security updates published after the nginx image was built —
# clears fixable base-image CVEs without waiting for the next upstream rebuild.
RUN apk upgrade --no-cache
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
