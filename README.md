# Kindle It

A self-hosted read-later pipeline for Kindle.

Save public long-form articles from desktop, Android, or iPhone/iPad. Send one article immediately, or collect several articles into a reading list and send them together as a single EPUB digest.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/gubblestudios/kindle-it)

## What it does

- **Send now:** extract a public article, strip media, and email a clean HTML document to Kindle.
- **Reading list:** queue articles in Upstash Redis.
- **EPUB digest:** combine queued articles into one EPUB with separate chapters and send it to Kindle.
- **Desktop bookmarks:** one-click "Send to Kindle" and "Add to Reading List" bookmarklets.
- **Android sharing:** install Kindle It as a PWA and share an article to either send it now or add it to the reading list.
- **iPhone/iPad sharing:** use an Apple Shortcut from the iOS/iPadOS Share Sheet for the same send-now or queue workflow.
- **Duplicate protection:** the reading list will not queue the same URL twice.

Kindle It works especially well for public Substack posts and other article pages that allow server-side fetching. Some sites block automated fetches or require a logged-in browser session; those may return a 403 or fail to extract.

## Architecture

```text
Article URL
   |
   +--> Send now --> Readability --> clean HTML --> Gmail --> Kindle
   |
   +--> Reading list --> Readability --> Upstash Redis
                                      |
                                      +--> EPUB digest --> Gmail --> Kindle
```

## Requirements

You will need:

- A Kindle / Amazon account with a **Send-to-Kindle email address**
- A Gmail or Google Workspace account with **2-Step Verification**
- A **Google App Password**
- A Vercel account
- An Upstash Redis database

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

## 3. Create an Upstash Redis database

The easiest route on Vercel is the **Upstash for Redis** Marketplace integration.

Connect a database to your Vercel project. Kindle It uses:

```text
KV_REST_API_URL
KV_REST_API_TOKEN
```

## 4. Configure environment variables

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
KV_REST_API_URL=your_upstash_rest_url
KV_REST_API_TOKEN=your_upstash_rest_token
```

Generate a strong app secret with:

```bash
openssl rand -hex 32
```

Never commit `.env.local`.

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

After deployment, add the same environment variables to the Vercel project. Environment-variable changes require a new deployment.

Your permanent production URL should be used for bookmarks and mobile setup, not a deployment-specific URL.

## 7. Desktop bookmarklets

Create two browser bookmarks and replace the placeholders with your deployed domain and `APP_SECRET`.

### Send immediately

Name: **📖 Kindle**

```javascript
javascript:(()=>{window.open('https://YOUR-DOMAIN/api/send?url='+encodeURIComponent(location.href)+'&key=YOUR_SECRET','_blank')})()
```

### Add to reading list

Name: **➕ Reading List**

```javascript
javascript:(()=>{window.open('https://YOUR-DOMAIN/api/queue/add?url='+encodeURIComponent(location.href)+'&key=YOUR_SECRET','_blank')})()
```

Treat these bookmarks as private because they contain your app secret.

## 8. Reading-list digest

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
6. Choose **📖 Send Now** or **➕ Add to Reading List**.

The PWA uses Android's Web Share Target support.

## 10. iPhone / iPad Share

iPhone and iPad use Apple Shortcuts rather than the Android PWA Share Target.

Create a Share Sheet shortcut that receives a URL, asks whether to **📖 Send Now** or **➕ Add to Reading List**, and calls the same Kindle It API endpoints used by Android and desktop.

Full step-by-step instructions:

[Set up Kindle It on iPhone / iPad](./docs/ios-shortcut.md)

Apple Shortcuts supports running shortcuts from the Share Sheet and making web requests with **Get Contents of URL**.

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

## Tech stack

- Next.js
- Mozilla Readability
- JSDOM
- Nodemailer / Gmail SMTP
- Upstash Redis
- epub-gen-memory
- Vercel

## License

MIT. See [LICENSE](./LICENSE).

## Disclaimer

Kindle It is an independent open-source project and is not affiliated with Amazon, Kindle, Substack, Google, Upstash, or Vercel.
