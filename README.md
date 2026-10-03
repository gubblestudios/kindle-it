# Kindle It

A self-hosted read-later pipeline for Kindle.

Save public long-form articles from desktop, Android, or iPhone/iPad. Send one article immediately, or collect several articles into a reading list and send them together as a single EPUB digest.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/gubblestudios/kindle-it)

## What it does

- **Send now:** extract a public article, strip media, and email a clean HTML document to Kindle.
- **Reading list:** optionally queue articles in persistent storage so the same list is available across devices.
- **EPUB digest:** combine queued articles into one EPUB with separate chapters and send it to Kindle.
- **Desktop bookmarks:** one-click "Send to Kindle" and "Add to Reading List" bookmarklets.
- **Android sharing:** install Kindle It as a PWA and share an article to either send it now or add it to the reading list.
- **iPhone/iPad sharing:** use an Apple Shortcut from the iOS/iPadOS Share Sheet for the same send-now or queue workflow.
- **Duplicate protection:** the reference Reading List implementation will not queue the same URL twice.

Kindle It works especially well for public Substack posts and other article pages that allow server-side fetching. Some sites block automated fetches or require a logged-in browser session; those may return a 403 or fail to extract.

## Architecture

```text
Article URL
   |
   +--> Send now --> Readability --> clean HTML --> Gmail --> Kindle
   |
   +--> Reading list --> Readability --> persistent storage
                                      |
                                      +--> EPUB digest --> Gmail --> Kindle
```

## Requirements

For the core **Send Now** flow, you need:

- A Kindle / Amazon account with a **Send-to-Kindle email address**
- A Gmail or Google Workspace account with **2-Step Verification**
- A **Google App Password**
- A Vercel account

A database is only needed if you want the shared **Reading List + EPUB digest** workflow.

## 1. Kindle setup

In Amazon, open **Manage Your Content and Devices** and find your Send-to-Kindle email address under Personal Document Settings.

It will look something like:

```text
yourname_123@kindle.com
```

Add the Gmail address you will use with Kindle It to Amazon's **Approved Personal Document Email List**.

Before continuing, test that you can manually email an HTML or EPUB attachment from that Gmail account to your Kindle.

## 2. Google App Password

Enable 2-Step Verification for the Google account that will send documents.

Then create a Google App Password for Kindle It. Use the 16-character app password as `GMAIL_APP_PASSWORD` — not your normal Google password.

## 3. Configure the core app

Copy the example file:

```bash
cp .env.example .env.local
```

Set:

```text
GMAIL_USER=you@gmail.com
GMAIL_APP_PASSWORD=your_google_app_password
KINDLE_EMAIL=your_kindle_address@kindle.com
APP_SECRET=a_long_random_secret
```

Generate a strong app secret with:

```bash
openssl rand -hex 32
```

Never commit `.env.local`.

At this point, **Send Now works without any database**.

## 4. Optional: add a shared Reading List

The shared Reading List needs persistent storage so your queue can be accessed across desktop and mobile.

The reference implementation currently uses **Upstash Redis**, but Upstash is not a requirement for the project. If you already use Airtable, Supabase, Postgres, another Redis provider, or another persistent store, you can adapt the storage layer instead.

The existing Upstash implementation uses:

```text
KV_REST_API_URL
KV_REST_API_TOKEN
```

If you want to keep the reference implementation, connect an Upstash Redis database and add those two values.

If you want to use an existing database instead, see:

[Use a different storage provider](./docs/custom-storage.md)

That guide is intentionally written so you can point an AI coding assistant at this repository and ask it to wire Kindle It to your existing storage without rebuilding the rest of the app.

## 5. Run locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## 6. Deploy to Vercel

You can use the Deploy button above or deploy with the Vercel CLI.

After deployment, add the four core environment variables to the Vercel project:

```text
GMAIL_USER
GMAIL_APP_PASSWORD
KINDLE_EMAIL
APP_SECRET
```

If you are using the reference Upstash Reading List, also add:

```text
KV_REST_API_URL
KV_REST_API_TOKEN
```

Environment-variable changes require a new deployment.

Use your permanent production URL for bookmarks and mobile setup, not a deployment-specific URL.

## 7. Desktop bookmarklets

Create two browser bookmarks and replace the placeholders with your deployed domain and `APP_SECRET`.

### Send immediately

Name: **📖 Kindle**

```javascript
javascript:(()=>{window.open('https://YOUR-DOMAIN/api/send?url='+encodeURIComponent(location.href)+'&key=YOUR_SECRET','_blank')})()
```

### Add to reading list

Only use this bookmark after configuring shared storage.

Name: **➕ Reading List**

```javascript
javascript:(()=>{window.open('https://YOUR-DOMAIN/api/queue/add?url='+encodeURIComponent(location.href)+'&key=YOUR_SECRET','_blank')})()
```

Treat these bookmarks as private because they contain your app secret.

## 8. Reading-list digest

This section is optional and requires persistent storage.

Open:

```text
https://YOUR-DOMAIN/reading-list
```

Save your app secret once in that browser.

Queued articles appear on this page. Click **📚 Send Digest to Kindle** to:

1. compile the queued articles into one EPUB,
2. email the EPUB to Kindle, and
3. clear the queue only after the email succeeds.

## 9. Android Share

On your Android phone:

1. Open `https://YOUR-DOMAIN/setup`.
2. Save your `APP_SECRET` once on that device.
3. Open the app homepage in Chrome.
4. Choose **Install app** / **Add to Home screen**.
5. Open a public article and tap **Share → Kindle It**.
6. Choose **📖 Send Now** or, if you configured shared storage, **➕ Add to Reading List**.

The PWA uses Android's Web Share Target support.

## 10. iPhone / iPad Share

iPhone and iPad use Apple Shortcuts rather than the Android PWA Share Target.

Create a Share Sheet shortcut that receives a URL, asks whether to **📖 Send Now** or **➕ Add to Reading List**, and calls the same Kindle It API endpoints used by Android and desktop.

Full step-by-step instructions:

[Set up Kindle It on iPhone / iPad](./docs/ios-shortcut.md)

The Reading List option requires persistent storage. **Send Now does not.**

## Bring your own storage

Kindle It is meant to be easy to adapt.

If you already have Airtable, Supabase, Postgres, another Redis provider, or another database, you do not need to add a second database just for Kindle It. Point your AI coding assistant at this repo and the storage guide:

[Use a different storage provider](./docs/custom-storage.md)

A copy/paste prompt is included there.

## Security notes

- All sensitive values belong in environment variables.
- `APP_SECRET` is used to protect the personal API endpoints.
- The current bookmarklets place the app secret in the URL, so do not share bookmarklet URLs or screenshots containing the secret.
- The app is intended as a **personal, self-hosted tool**, not a multi-user hosted service.
- If a credential is ever committed publicly, rotate it immediately even if the commit is later deleted.

## Known limitations

- Public URL fetching is the core extraction method.
- Sites that block server-side fetching may return `403`.
- Android can use the installed PWA directly as a Share target. iPhone/iPad uses Apple Shortcuts from the Share Sheet instead.
- Logged-in/paywalled content is not currently captured from the browser session.
- Images, video, audio, embeds, SVGs, and other media are intentionally stripped for a cleaner Kindle reading experience.
- The repository currently ships with Upstash Redis as the implemented shared-storage backend. Other providers require a small persistence-layer adaptation.

## Tech stack

- Next.js
- Mozilla Readability
- JSDOM
- Nodemailer / Gmail SMTP
- epub-gen-memory
- Upstash Redis in the reference Reading List implementation
- Vercel

## License

MIT. See [LICENSE](./LICENSE).

## Disclaimer

Kindle It is an independent open-source project and is not affiliated with Amazon, Kindle, Substack, Google, Upstash, or Vercel.
