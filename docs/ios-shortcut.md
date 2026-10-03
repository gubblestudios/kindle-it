# iPhone / iPad Share Sheet setup

Kindle It can be used from the iOS/iPadOS Share Sheet with Apple Shortcuts.

Safari/WebKit does not currently implement the Web Share Target API used by the Android PWA, so iPhone/iPad uses a Shortcut instead:

```text
Share article
   ↓
Kindle It shortcut
   ↓
Choose:
  📖 Send Now
  ➕ Add to Reading List
```

The backend is the same as Android and desktop.

## Before you start

You need:

- a working Kindle It deployment
- your permanent production domain, for example `https://your-app.vercel.app`
- your `APP_SECRET`

Treat the Shortcut as private because it contains your app secret.

## Build the Shortcut

### 1. Create the shortcut

Open **Shortcuts** on iPhone or iPad and create a new shortcut named:

```text
Kindle It
```

Open the shortcut's details and turn on **Show in Share Sheet**.

Set the accepted input type to **URLs**. This keeps Kindle It visible when sharing webpages and links without cluttering unrelated share sheets.

### 2. URL-encode the shared link

Add the **URL Encode** action.

Set its input to **Shortcut Input**.

This matters because shared article URLs often contain their own query parameters such as `?` and `&`.

### 3. Add a menu

Add **Choose from Menu** with two options:

```text
📖 Send Now
➕ Add to Reading List
```

### 4. Configure "Send Now"

Under the **📖 Send Now** branch, add a **Text** or **URL** action containing:

```text
https://YOUR-DOMAIN/api/send?url=ENCODED_URL&key=YOUR_SECRET
```

Replace:

- `YOUR-DOMAIN` with your production domain
- `YOUR_SECRET` with your `APP_SECRET`
- `ENCODED_URL` with the magic variable output from the **URL Encode** action

Then add:

```text
Get Contents of URL
```

Use the default **GET** method.

Optional: add **Show Notification** with:

```text
Sent to Kindle
```

### 5. Configure "Add to Reading List"

Under the **➕ Add to Reading List** branch, add a **Text** or **URL** action containing:

```text
https://YOUR-DOMAIN/api/queue/add?url=ENCODED_URL&key=YOUR_SECRET
```

Use the same replacements as above, then add:

```text
Get Contents of URL
```

Use **GET**.

Optional: add **Show Notification** with:

```text
Added to Reading List
```

## Test it

Open a public Substack article in Safari:

1. Tap **Share**.
2. Choose **Kindle It**.
3. Choose **📖 Send Now**.
4. Confirm the article arrives on Kindle.

Then test again with **➕ Add to Reading List** and confirm the article appears at:

```text
https://YOUR-DOMAIN/reading-list
```

## Sending a digest

The reading list is shared across desktop, Android, and iPhone/iPad because it is stored in the same Upstash Redis database.

Open:

```text
https://YOUR-DOMAIN/reading-list
```

and tap **📚 Send Digest to Kindle** when you are ready to send the queued articles as one EPUB.

## Why iOS setup is different

Android/Chrome supports installed PWAs as Web Share Targets, so Kindle It can appear directly as an app in the Android Share menu.

Safari/WebKit currently does not implement the Web Share Target API. Apple Shortcuts provides the equivalent Share Sheet workflow on iPhone and iPad.

WebKit tracking issue: https://bugs.webkit.org/show_bug.cgi?id=194593
