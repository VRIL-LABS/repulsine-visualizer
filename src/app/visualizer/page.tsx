"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const RepulsineScene = dynamic(
  () =>
    import("@/components/RepulsineScene/RepulsineScene").then(
      (m) => m.RepulsineScene
    ),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#020507",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid rgba(64,64,64,0.8)",
            borderTopColor: "#0f766e",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <p
          style={{
            color: "#a3a3a3",
            fontSize: "14px",
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          Initializing Repulsine Physics…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    ),
  }
);

export default function VisualizerPage() {
  const router = useRouter();
  return <RepulsineScene onBack={() => router.push("/")} />;
}
