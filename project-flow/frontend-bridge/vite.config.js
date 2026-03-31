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
  build: {
    target: "esnext"
  }
});
