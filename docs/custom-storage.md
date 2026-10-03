# Use a different storage provider

Kindle It does **not** require Upstash Redis unless you want to use the repository's current shared Reading List implementation.

The core **Send Now** flow does not use a database.

If you want the shared Reading List + EPUB digest, Kindle It needs persistent storage somewhere so the queue can be shared across devices. You can keep the existing Upstash implementation or adapt it to storage you already use, such as:

- Airtable
- Supabase
- Postgres
- another Redis provider
- another persistent database or key/value store

This document gives an AI coding assistant enough context to make that change without rewriting the rest of the project.

## Files that currently talk to storage

The current Upstash implementation is primarily in:

```text
app/api/queue/add/route.ts
app/api/queue/list/route.ts
app/api/digest/send/route.ts
```

The Reading List UI is:

```text
app/reading-list/page.tsx
```

The article extraction and single-article Send Now flow should not need to change.

## Reading item shape

Preserve this logical data shape:

```ts
type ReadingItem = {
  id: string;
  url: string;
  title: string;
  byline?: string;
  content: string;
  addedAt: string;
};
```

The storage provider does not have to use these exact column names internally, but the API routes should continue to return the same shape to the UI.

## Behavior to preserve

A replacement storage implementation should preserve these behaviors:

1. Add an article to the shared queue.
2. Prevent the same URL from being queued twice.
3. Store the cleaned article content, not just the URL.
4. Return queued items in a stable reading order.
5. Let the digest endpoint retrieve the full queued items.
6. Only remove queued items **after** the Kindle email succeeds.
7. Keep the existing API URLs and response shapes whenever practical so the desktop bookmarks, Android PWA, iOS Shortcut, and Reading List UI keep working.

## What can change

The persistence layer can change completely.

For example:

### Airtable

An AI assistant might create a table with:

```text
id
url
title
byline
content
addedAt
```

and use an Airtable personal access token + base/table IDs instead of the Upstash environment variables.

### Supabase / Postgres

An AI assistant might create a `reading_items` table with a unique constraint on `url`, order by `added_at`, and delete rows only after a successful digest send.

### Another Redis provider

The existing logic can usually be adapted with the smallest changes because the current implementation already uses Redis-like key/value and sorted-set operations.

## Copy/paste prompt for your AI coding assistant

Paste this into your coding assistant after giving it access to your fork/deployment:

> I deployed this GitHub repo: https://github.com/gubblestudios/kindle-it
>
> I want to use my existing **[AIRTABLE / SUPABASE / POSTGRES / OTHER PROVIDER]** instead of Upstash Redis for the shared Reading List.
>
> Read `docs/custom-storage.md` and inspect:
> - `app/api/queue/add/route.ts`
> - `app/api/queue/list/route.ts`
> - `app/api/digest/send/route.ts`
> - `app/reading-list/page.tsx`
>
> Replace only the persistence layer unless another small change is required for compatibility.
>
> Preserve:
> - the existing `ReadingItem` data shape
> - duplicate protection by URL
> - stable queue ordering
> - storing the cleaned article content
> - the existing API behavior used by the desktop bookmarks, Android share flow, iOS Shortcut, and Reading List page
> - clearing queued articles only after a successful Kindle digest email
>
> Do not change the single-article Send Now flow.
>
> Before changing code, tell me exactly what credentials, table/base/project IDs, schema, or environment variables you need from me. Do not ask me to create a second database if my existing provider can support the queue.

## If you do not want shared storage

You can use Kindle It only for **Send Now**.

That requires only:

```text
GMAIL_USER
GMAIL_APP_PASSWORD
KINDLE_EMAIL
APP_SECRET
```

The Reading List routes will not work until a storage backend is configured, but single-article Kindle delivery is independent of them.
