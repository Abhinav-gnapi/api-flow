import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "frontendBridge",
      filename: "remoteEntry.js",
      exposes: {
        "./LegacyFrontend": "./src/LegacyFrontend.jsx"
      },
      shared: ["react", "react-dom"]
    })
  ],
  server: {
    // Allow host apps running on different local ports (e.g. 4200) to load remoteEntry.js in dev.
    cors: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*"
    }
  },
  build: {
    target: "esnext"
  }
});
