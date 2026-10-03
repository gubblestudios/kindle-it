# Use your own storage for the Reading List

The shared Reading List is optional.

**Send Now does not need a database.** It fetches the article, cleans it, and emails it directly to Kindle.

Persistent storage is only used for:

- adding articles to a shared Reading List
- viewing that queue from another device
- building a multi-article EPUB digest
- clearing queued items after a successful send

Kindle It currently ships with **Upstash Redis** as the reference implementation. You do not have to use Upstash.

If you already have Airtable, Supabase, Postgres, another Redis provider, or another persistent store, point your AI coding assistant at this repository and ask it to replace only the persistence layer.

## Files to inspect

The current storage behavior lives in:

```text
app/api/queue/add/route.ts
app/api/queue/list/route.ts
app/api/digest/send/route.ts
```

Do not change the article extraction or Kindle email flow unless your storage provider requires it.

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

Your provider can store these fields however it prefers.

## Behavior to preserve

A replacement storage implementation should preserve these behaviors:

1. **Add an article**
   - save the cleaned article content, not just the URL
   - generate or preserve a stable item ID

2. **Prevent duplicates**
   - the same article URL should not be queued twice

3. **List queued articles**
   - return all queued items
   - preserve a predictable reading order

4. **Build a digest**
   - retrieve the full stored article content for every queued item
   - keep article ordering intact

5. **Clear only after success**
   - do not delete queued items until the Kindle email has been sent successfully

6. **Keep the existing app behavior**
   - preserve the current API routes and response shapes where practical
   - keep the existing Reading List UI working
   - keep the same `APP_SECRET` authorization behavior unless you intentionally replace it

## Current Upstash implementation

The reference implementation uses:

```text
KV_REST_API_URL
KV_REST_API_TOKEN
```

and stores:

- each article at `reading:item:{id}`
- queue order in the `reading:queue` sorted set

This is only an implementation detail. A replacement does not need to mimic Redis internally.

## Example provider mappings

An AI coding assistant can translate the queue into whichever provider you already use.

For example:

### Airtable

A table could contain:

```text
id
url
title
byline
content
addedAt
```

Use a unique URL or ID check to prevent duplicates, and sort by `addedAt`.

### Supabase / Postgres

A table could use:

```sql
id text primary key
url text unique not null
title text not null
byline text
content text not null
added_at timestamptz not null
```

Query by `added_at` to preserve reading order.

These are examples, not required schemas.

## Copy/paste prompt for an AI coding assistant

Replace the bracketed provider name before using this:

> I deployed this GitHub repo: `gubblestudios/kindle-it`.
>
> I want to use my existing **[Airtable / Supabase / Postgres / Redis / other provider]** instead of Upstash for the shared Reading List.
>
> Review `docs/custom-storage.md` and these existing routes:
> - `app/api/queue/add/route.ts`
> - `app/api/queue/list/route.ts`
> - `app/api/digest/send/route.ts`
>
> Replace only the persistence layer. Preserve the existing API behavior, `ReadingItem` data shape, duplicate protection, article ordering, Reading List UI, and the rule that queued items are deleted only after a successful digest send.
>
> Keep **Send Now** working exactly as it does today.
>
> Before changing code, tell me exactly which credentials, IDs, table/schema setup, and environment variables you need from me for **[provider]**. Then make the smallest code changes necessary and tell me what to add to Vercel.

## No shared storage?

You can also ask an AI coding assistant to make the queue browser-local with `localStorage` or IndexedDB.

That removes the database requirement, but the Reading List will no longer sync between devices and clearing browser data may remove the queue.

For most people who want to add on phone and send later from desktop, use a shared persistent store.
