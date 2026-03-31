import React from "react";

const legacyFrontendUrl =
  import.meta.env.VITE_LEGACY_FRONTEND_PUBLIC_URL || "http://localhost:8181";

export default function LegacyFrontend() {
  return (
    <iframe
      title="Legacy Frontend"
      src={legacyFrontendUrl}
      style={{ width: "100%", height: "100vh", border: "0", display: "block" }}
    />
  );
}
