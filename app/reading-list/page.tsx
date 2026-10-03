"use client";

import { useEffect, useState } from "react";

type ReadingItem = {
  id: string;
  url: string;
  title: string;
  byline?: string;
  addedAt: string;
};

export default function ReadingListPage() {
  const [items, setItems] = useState<ReadingItem[]>([]);
  const [secret, setSecret] = useState("");
  const [needsSecret, setNeedsSecret] = useState(false);
  const [status, setStatus] = useState("Loading…");
  const [sending, setSending] = useState(false);

  async function loadReadingList(key: string) {
    setStatus("Loading…");

    const response = await fetch(
      `/api/queue/list?key=${encodeURIComponent(key)}`
    );

    if (response.status === 401) {
      localStorage.removeItem("kindleSecret");
      setNeedsSecret(true);
      setStatus("");
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error || "Could not load Reading List.");
      return;
    }

    setItems(data.items || []);
    setNeedsSecret(false);
    setStatus("");
  }

  function saveSecret() {
    const value = secret.trim();
    if (!value) return;

    localStorage.setItem("kindleSecret", value);
    setSecret("");
    loadReadingList(value);
  }

  async function sendDigest() {
    const key = localStorage.getItem("kindleSecret");

    if (!key) {
      setNeedsSecret(true);
      return;
    }

    setSending(true);
    setStatus("Building your digest…");

    try {
      const response = await fetch(
        `/api/digest/send?key=${encodeURIComponent(key)}`
      );

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error || "Could not send digest.");
        return;
      }

      setItems([]);
      setStatus(
        `✓ Sent ${data.articleCount} ${
          data.articleCount === 1 ? "article" : "articles"
        } to Kindle`
      );
    } catch {
      setStatus("Something went wrong sending the digest.");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    const savedSecret = localStorage.getItem("kindleSecret");

    if (!savedSecret) {
      setNeedsSecret(true);
      setStatus("");
      return;
    }

    loadReadingList(savedSecret);
  }, []);

  if (needsSecret) {
    return (
      <main
        style={{
          maxWidth: 650,
          margin: "60px auto",
          padding: 24,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h1>Reading List</h1>
        <p>Enter your Kindle It secret once on this browser.</p>

        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="APP_SECRET"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: 12,
            marginBottom: 12,
          }}
        />

        <button onClick={saveSecret}>Open Reading List</button>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: 700,
        margin: "60px auto",
        padding: 24,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Reading List</h1>

      <p>
        {items.length} {items.length === 1 ? "article" : "articles"} queued
      </p>

      {items.length > 0 && (
        <button
          onClick={sendDigest}
          disabled={sending}
          style={{
            padding: "12px 18px",
            fontSize: 16,
            marginBottom: 24,
            cursor: sending ? "default" : "pointer",
          }}
        >
          {sending ? "Sending…" : "📚 Send Digest to Kindle"}
        </button>
      )}

      {status && <p>{status}</p>}

      {items.length === 0 && !status && (
        <p>Your Reading List is empty.</p>
      )}

      {items.map((item, index) => (
        <article
          key={item.id}
          style={{
            padding: "20px 0",
            borderBottom: "1px solid #ddd",
          }}
        >
          <div style={{ fontSize: 14, opacity: 0.6 }}>{index + 1}</div>

          <h2 style={{ marginBottom: 6 }}>{item.title}</h2>

          {item.byline && (
            <p style={{ marginTop: 0, opacity: 0.7 }}>{item.byline}</p>
          )}

          <a href={item.url} target="_blank" rel="noreferrer">
            View original
          </a>
        </article>
      ))}
    </main>
  );
}
