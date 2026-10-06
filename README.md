# Sky Anime — Personal AI Hub

A modular, private hub for your anime, books and notes, with an AI assistant that
knows what you've saved. Runs local-first (Ollama) or with Claude.

**Live:** https://Skyanime.net · **Stack:** React 19 · Fastify · Prisma · Postgres · Lucia

---

## Features

| Module | What it does |
| :--- | :--- |
| **Notes** | Quick private notes, scoped per user. |
| **Anime** | Search any anime, track status (watching / paused / dropped…), custom sections, drag-to-reorder, Top 10. |
| **Books** | Search Open Library, organize your library into custom sections. |
| **AI Chat** | Chat with an AI that gets your hub data as context. Switch provider per message. |
| **Public landing** | Trending anime, seasonal anime, airing schedule, trending books, bestsellers and new releases. No login needed. |

Modules plug in through a registry ([apps/api/src/modules/registry.ts](apps/api/src/modules/registry.ts)).
Adding one = new folder + one line in the registry. The core stays untouched.

---

## External APIs

| API | Used for | Where | Key needed |
| :--- | :--- | :--- | :--- |
| [AniList GraphQL](https://anilist.gitbook.io/anilist-apiv2-docs) | Anime search (primary), landing: trending, season, airing schedule | `apps/api/.../anime.source.ts`, `apps/web/src/landing/anilist.ts` | No |
| [Kitsu](https://kitsu.docs.apiary.io) | Anime search **fallback** when AniList fails (403 / timeout) | `anime.source.ts` | No |
| [TMDB](https://developer.themoviedb.org) | Enriches anime results with HD poster + backdrop | `tmdb.source.ts`, `backfill-tmdb.ts` | `TMDB_READ_TOKEN` (optional) |
| [Open Library](https://openlibrary.org/developers/api) | Book search, covers, landing trending / bestsellers / new releases | `books.source.ts`, `apps/web/src/landing/openlibrary.ts` | No |
| [Ollama](https://github.com/ollama/ollama/blob/main/docs/api.md) | Local LLM (`/api/chat`, default `qwen2.5:7b`) | `packages/ai/src/ollama.ts` | No |
| [Anthropic Claude](https://docs.anthropic.com) | Cloud LLM via `@anthropic-ai/sdk` | `packages/ai/src/claude.ts` | `ANTHROPIC_API_KEY` |

> Same idea for media and AI: every external source sits behind an interface,
> so if one provider fails another one can answer.

---

## Hub API (own endpoints)

All routes except `/health`, `/modules` and `/auth/*` require a session cookie.
In production they are served under `/api`.

| Method | Route | Description |
| :--- | :--- | :--- |
| GET | `/health` | Liveness check |
| GET | `/modules` | Module manifest (frontend builds nav from it) |
| POST | `/auth/register` · `/auth/login` · `/auth/logout` | Session auth |
| GET | `/auth/me` | Current user |
| GET | `/ai/providers` | Available AI providers |
| POST | `/ai/chat` | Send a message to the chosen provider |
| GET / POST | `/notes` | List / create notes |
| PATCH / DELETE | `/notes/:id` | Update / delete note |
| GET | `/anime/search?q=` | Search external sources |
| GET / POST | `/anime` | List / save anime |
| PATCH / DELETE | `/anime/:id` | Update status / remove |
| GET / POST | `/anime/sections` | List / create custom sections |
| PATCH | `/anime/sections/reorder` · `/anime/sections/:id` | Reorder / rename |
| DELETE | `/anime/sections/:id` | Delete section |
| — | `/books/...` | Same shape as `/anime` |

---

## Security

- **Passwords:** `argon2id` (`@node-rs/argon2`), more resistant to GPU cracking than bcrypt.
- **Sessions:** Lucia, stored in Postgres. Cookies are `httpOnly`, `SameSite=Lax`, `Secure` in prod.
- **Isolation:** every query is scoped to `userId`.
- **Validation:** Zod on every request body and on env vars at boot. If config is invalid the process exits.
- **Secrets:** only in `.env` / Vercel dashboard, never in git.

---

## Tech Stack

| Layer | Tech |
| :--- | :--- |
| Monorepo | pnpm workspaces + Turborepo |
| Frontend | React 19, TypeScript, Vite, Tailwind |
| Backend | Node ≥20, Fastify 5, TypeScript |
| DB | PostgreSQL + Prisma (Docker local, Neon in prod) |
| Auth | Lucia + argon2 |
| AI | `packages/ai` — `AIProvider` interface (Ollama / Claude) |
| Tests | Vitest + Supertest |
| Deploy | Vercel (SPA + Fastify as one serverless function) |

---

## Project Structure

```
apps/
  api/        Fastify API (core/ = auth, ai, db · modules/ = notes, anime, books)
  web/        React SPA (core/, modules/, landing/)
packages/
  ai/         AIProvider + Ollama/Claude adapters
  shared/     Types + Zod schemas shared by api and web
api/index.ts  Vercel serverless entry (wraps the Fastify app)
```

---

## Running Locally

**Requirements:** Node ≥20, pnpm, Docker. Optional: Ollama.

```bash
pnpm install
cp .env.example .env          # set AUTH_SECRET (≥16 chars, random)
pnpm db:up                    # Postgres in Docker
pnpm --filter @hub/api prisma:migrate
pnpm dev
```

- Web → http://localhost:5173
- API → http://localhost:3000

**AI:** `ollama run qwen2.5:7b` for local mode, or set `ANTHROPIC_API_KEY` and
pick Claude in the chat dropdown.

### Scripts

| Command | Does |
| :--- | :--- |
| `pnpm dev` | Run web + api in watch mode |
| `pnpm build` | Build all packages |
| `pnpm test` | Vitest |
| `pnpm lint` / `pnpm typecheck` | Lint / type check |
| `pnpm db:up` / `pnpm db:down` | Start / stop Postgres |

### Environment Variables

| Var | Required | Notes |
| :--- | :--- | :--- |
| `DATABASE_URL` | ✅ | Postgres URL (pooled URL in prod) |
| `DIRECT_URL` | prod | Non-pooled URL, only for `prisma migrate deploy` |
| `AUTH_SECRET` | ✅ | ≥16 chars |
| `WEB_ORIGIN` | dev | CORS origin, default `http://localhost:5173` |
| `AI_DEFAULT_PROVIDER` | — | `ollama` (default) or `claude` |
| `OLLAMA_BASE_URL` / `OLLAMA_MODEL` | — | Default `localhost:11434` / `qwen2.5:7b` |
| `ANTHROPIC_API_KEY` / `CLAUDE_MODEL` | — | Only for Claude mode |
| `TMDB_READ_TOKEN` | — | Empty = no TMDB enrichment |
| `VITE_API_URL` | — | Dev: `http://localhost:3000` · Prod: `/api` |

---

## Deploy (Vercel + Neon)

1. Create a Neon DB. Put the pooled URL (`-pooler`, `pgbouncer=true&connection_limit=1`) in `DATABASE_URL` and the direct URL in `DIRECT_URL`.
2. Add the env vars in the Vercel dashboard.
3. Push. `vercel.json` builds shared → ai → api → web and rewrites `/api/*` to the serverless function.

---

## Roadmap

- [x] **Phase 1:** Auth, hybrid AI layer, Notes / Anime / Books, public landing, Vercel deploy
- [ ] **Phase 2:** Finance module (encryption at rest) + audit log
- [ ] **Phase 3:** "Jarvis mode": voice + tool-calling ("add this anime to my list")
- [ ] **Phase 4:** Music module, more hobbies, secure cloud AI access
