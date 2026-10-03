"use client";

import { useState } from "react";

export default function SetupPage() {
  const [secret, setSecret] = useState("");
  const [saved, setSaved] = useState(false);

  function saveSecret() {
    const value = secret.trim();

    if (!value) return;

    localStorage.setItem("kindleSecret", value);
    setSaved(true);
    setSecret("");
  }

  return (
    <main style={{
      maxWidth: 500,
      margin: "80px auto",
      padding: 24,
      fontFamily: "sans-serif"
    }}>
      <h1>Kindle It</h1>

      <p>Enter your APP_SECRET once on this device.</p>

      <input
        type="password"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
        placeholder="APP_SECRET"
        style={{
          width: "100%",
          padding: 14,
          fontSize: 16,
          marginBottom: 12
        }}
      />

      <button
        onClick={saveSecret}
        style={{
          padding: "12px 20px",
          fontSize: 16
        }}
      >
        Save
      </button>

      {saved && <p>✓ Saved. This phone is ready.</p>}
    </main>
  );
}
