import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const remoteEntryUrl =
    env.VITE_REMOTE_ENTRY_URL ||
    (mode === "development"
      ? "http://localhost:4173/remoteEntry.js"
      : "http://localhost:4273/remoteEntry.js");

  return {
    plugins: [
      react(),
      federation({
        name: "host",
        remotes: {
          frontendBridge: {
            type: "module",
            name: "frontendBridge",
            entry: remoteEntryUrl,
            entryGlobalName: "frontendBridge",
            shareScope: "default"
          }
        },
        shared: ["react", "react-dom"]
      })
    ],
    build: {
      target: "esnext"
    }
  };
});
