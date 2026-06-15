# Mosmos Waitlist

SvelteKit waitlist app. Signups are stored in a Notion database and a welcome email is sent via Resend.

## Stack

- [SvelteKit](https://svelte.dev/docs/kit) (Svelte 5, TypeScript)
- [@notionhq/client](https://github.com/makenotion/notion-sdk-js) — waitlist database
- [Resend](https://resend.com) — welcome email
- [Upstash Redis](https://upstash.com) — rate limiting (2 req/min per IP)
- ESLint + Prettier

## Setup

```sh
cp .env.example .env   # fill in NOTION_SECRET, NOTION_DB, RESEND_API_KEY, UPSTASH_*
pnpm install
pnpm run dev
```

The Notion database needs two properties: `Name` (Title) and `Email` (Email).

## Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `pnpm run dev`    | Start dev server         |
| `pnpm run build`  | Production build         |
| `pnpm run check`  | svelte-check (types)     |
| `pnpm run lint`   | Prettier + ESLint checks |
| `pnpm run format` | Format with Prettier     |

## API

`POST /api/waitlist` with `{ "name": string, "email": string }` — rate-limited by IP, then adds the entry to Notion and sends the welcome email. Returns `429` when the limit is exceeded.
