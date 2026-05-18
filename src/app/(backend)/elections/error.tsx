'use client'

import { useEffect } from "react";

export default function ElectionsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[ElectionsError]", error.digest ?? "no-digest");
  }, [error]);

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: "#fef2f2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          marginBottom: 20,
        }}
      >
        ⚠️
      </div>
      <h1
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: "#111827",
          margin: "0 0 8px",
        }}
      >
        Failed to load Elections
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "#6b7280",
          textAlign: "center",
          maxWidth: 360,
          margin: "0 0 24px",
        }}
      >
        A server error occurred. Please try again — if the problem persists,
        contact your administrator.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={reset}
          style={{
            padding: "10px 20px",
            background: "#0f172a",
            color: "white",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Try again
        </button>
        <button
          onClick={() => { window.location.href = '/elections' }}
          style={{
            padding: "10px 20px",
            background: "white",
            color: "#374151",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Back to Elections
        </button>
      </div>
    </div>
  );
}
