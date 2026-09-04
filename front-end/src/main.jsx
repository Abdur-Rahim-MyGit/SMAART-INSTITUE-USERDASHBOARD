import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import "./index.css";
import "./smaart-design-system.css";
import "./i18n-setup";
import { installMediaStreamRegistry } from "./utils/mediaStreams";

// Register every camera/microphone stream so a held attempt can shut them all.
installMediaStreamRegistry();

// DEV ONLY — kill any stale PWA service worker.
// This app registers a service worker (PWAPrompt → useRegisterSW). Once
// registered from a production build, that SW keeps intercepting fetches and
// serving STALE cached assets in dev — including the AI web worker
// (proctoring.worker.js) and the ONNX models — so source fixes never reach the
// browser (hard-reload does NOT bypass a service worker). Unregister it and
// clear its caches on dev startup, then reload once so live code is served.
if (import.meta.env.DEV && typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    if (!regs.length) return;
    Promise.all(regs.map((r) => r.unregister()))
      .then(() => (window.caches ? caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))) : null))
      .finally(() => window.location.reload());
  }).catch(() => { /* noop */ });
}

createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
