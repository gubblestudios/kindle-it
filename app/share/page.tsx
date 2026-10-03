"use client";

import { useEffect, useState } from "react";

function extractUrl(text: string | null) {
  if (!text) return null;

  const match = text.match(/https?:\/\/[^\s]+/);
  if (!match) return null;

  return match[0].replace(/[)\],.!?]+$/, "");
}

export default function SharePage() {
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const url =
      params.get("url") ||
      extractUrl(params.get("text"));

    setSharedUrl(url);

    if (!url) {
      setStatus("Couldn't find a URL in what was shared.");
    }
  }, []);

  async function runAction(action: "send" | "queue") {
    if (!sharedUrl) return;

    const secret = localStorage.getItem("kindleSecret");

    if (!secret) {
      setStatus(
        "Setup required. Open /setup in this app first."
      );
      return;
    }

    setWorking(true);
    setStatus(
      action === "send"
        ? "Sending to Kindle…"
        : "Adding to Reading List…"
    );

    const endpoint =
      action === "send"
        ? "/api/send"
        : "/api/queue/add";

    try {
      const response = await fetch(
        `${endpoint}?url=${encodeURIComponent(
          sharedUrl
        )}&key=${encodeURIComponent(secret)}`
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("kindleSecret");
        setStatus(
          "Your saved secret was rejected. Open /setup and save it again."
        );
        return;
      }

      if (!response.ok) {
        setStatus(data.error || "Something went wrong.");
        return;
      }

      if (action === "send") {
        setStatus(`✓ Sent to Kindle\n\n${data.title || ""}`);
      } else {
        setStatus(
          data.alreadyQueued
            ? "✓ Already in Reading List"
            : `✓ Added to Reading List\n\n${data.title || ""}`
        );
      }
    } catch {
      setStatus("Something went wrong.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 500,
        margin: "60px auto",
        padding: 24,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Kindle It</h1>

      {sharedUrl && !working && !status && (
        <>
          <p>What do you want to do with this article?</p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginTop: 24,
            }}
          >
            <button
              onClick={() => runAction("send")}
              style={{ padding: 16, fontSize: 16 }}
            >
              📖 Send Now
            </button>

            <button
              onClick={() => runAction("queue")}
              style={{ padding: 16, fontSize: 16 }}
            >
              ➕ Add to Reading List
            </button>
          </div>
        </>
      )}

      {status && (
        <>
          <p style={{ whiteSpace: "pre-line" }}>{status}</p>

          {!working && sharedUrl && (
            <button
              onClick={() => {
                setStatus("");
              }}
            >
              Back
            </button>
          )}
        </>
      )}
    </main>
  );
}
