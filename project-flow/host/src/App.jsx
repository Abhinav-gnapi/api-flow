import React, { Suspense } from "react";

const LegacyFrontend = React.lazy(() => import("frontendBridge/LegacyFrontend"));

export default function App() {
  return (
    <main style={{ margin: 0, padding: 0 }}>
      <Suspense fallback={null}>
        <LegacyFrontend />
      </Suspense>
    </main>
  );
}
