import { defineConfig } from "vite";

// The app loads Vue, Vue Router, AG Grid, and ECharts from CDN <script> tags in
// index.html (see src/lib/vue.js, which re-exports the window globals), so there
// is nothing to pre-bundle. Vite just serves index.html with HMR / live reload.
export default defineConfig({
  server: {
    port: 5173, // whitelisted by the backend CORS config (WebConfig.java)
    open: true,
    // Same-origin in dev: the app calls relative URLs (/api/v1/...) and Vite
    // forwards them to the Spring backend, so no CORS and no env-specific
    // base URL. In production, serve the built app behind the same origin.
    // docker-compose maps the backend to host port 8456 (8080 inside the
    // container); set BACKEND_URL when running the backend elsewhere.
    proxy: {
      "/api": process.env.BACKEND_URL || "http://localhost:8456",
    },
  },
  preview: {
    port: 4173, // whitelisted by the backend CORS config (WebConfig.java)
  },
});
