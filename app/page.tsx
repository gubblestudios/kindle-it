export default function Home() {
  return (
    <main
      style={{
        maxWidth: 700,
        margin: "60px auto",
        padding: 24,
        fontFamily: "Arial, sans-serif",
        lineHeight: 1.5,
      }}
    >
      <h1 style={{ fontSize: 40, marginBottom: 8 }}>Kindle It</h1>
      <p style={{ fontSize: 18, marginTop: 0 }}>
        A self-hosted read-later pipeline for Kindle.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginTop: 32,
          maxWidth: 360,
        }}
      >
        <a
          href="/reading-list"
          style={{
            display: "block",
            padding: 14,
            border: "1px solid #ccc",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          📚 Open Reading List
        </a>

        <a
          href="/setup"
          style={{
            display: "block",
            padding: 14,
            border: "1px solid #ccc",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          🔐 Device Setup
        </a>
      </div>

      <section style={{ marginTop: 40 }}>
        <h2>How it works</h2>
        <p>
          Send an article immediately to Kindle, or add several articles to
          your Reading List and send them together as one EPUB digest.
        </p>
        <p>
          Send Now works without a database. The shared Reading List is optional
          and needs persistent storage; the reference implementation uses
          Upstash, but you can adapt it to an existing database.
        </p>
        <p>
          On Android, install this site as an app and use the system Share menu
          to send or queue articles. On iPhone and iPad, use an Apple Shortcut
          from the Share Sheet for the same workflow.
        </p>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>First time here?</h2>
        <p>
          Configure your Kindle address, Gmail app password, and app secret to
          start using Send Now. Shared Reading List storage is optional. See the
          project README for setup instructions and guidance for using an
          existing database.
        </p>
      </section>
    </main>
  );
}
