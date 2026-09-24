# Sky Anime — Your Personal AI Hub

Welcome to Sky Anime. This isn't just another platform for tracking shows or reading lists: it's your centralized digital space. A modular Personal Hub where you organize your daily life (anime, books, notes, and more) assisted by an AI you control.

Manage your passions, capture daily notes, and chat with an AI assistant that understands the full context of everything you store.

---

## What is this about?

The idea is simple: one single place for all your stuff. Instead of relying on a dozen different apps, Sky Anime brings them together into a smooth, private experience.

Currently includes:

* **Notes:** Capture ideas and quick thoughts on the fly with full security.
* **Contextual AI Chat:** Talk to an AI that knows what you have saved in your hub to deliver better answers.
* **Anime Module:** Track what you're watching, paused, or dropped, and build custom sections or a personalized Top 10 list.
* **Book Module:** Discover trending titles, check bestsellers, and organize your personal library your way.

> **The best part?** Everything is built modally. If you want to plug in a module for Finances, Music, or any other hobby tomorrow, it connects directly without breaking the core app.

---

## The AI "Brain": Total Freedom

AI shouldn't be a luxury or depend exclusively on a single external service. Sky Anime lets you switch providers with a single click based on your needs:

* **Local Mode (Default - Ollama + Qwen 7B):** Free, 100% private, zero token cost, and runs offline.
* **Claude Mode (Anthropic):** For when you need maximum power from a top-tier model.

If one provider goes down, your hub keeps running. You stay in control.

---

## Security & Architecture Decisions

This project is engineered as the foundation for something much larger, so security isn't an afterthought—it's built into the ground floor:

1. **Hardened Passwords:** Using `argon2id` to resist GPU cracking significantly better than traditional bcrypt.
2. **First-Party Sessions (Lucia Auth):** Zero opaque external dependencies. Sessions live in your database with cookies protected against XSS and CSRF (`httpOnly`, `SameSite=Lax`).
3. **Strict Isolation:** Every record is scoped to your `userId`.
4. **Server Validation:** Powered by `Zod`—nothing hits the database without being validated server-side first.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Monorepo** | pnpm workspaces + Turborepo |
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS (Dark Mode) |
| **Backend** | Node.js + TypeScript + Fastify |
| **Database** | PostgreSQL + Prisma ORM |
| **Authentication** | Lucia Auth + argon2 |
| **Artificial Intelligence** | `packages/ai` (Ollama local by default / Claude API) |
| **Testing** | Vitest + Supertest |

---

## Running Locally

### Prerequisites
* Node.js (≥20)
* pnpm
* Docker (for the Postgres database)
* (Optional) Ollama if you want to run the AI locally.

### Quick Start

```bash
# 1. Clone and install dependencies:
pnpm install

# 2. Configure environment:
cp .env.example .env
# Make sure to set AUTH_SECRET to a long, random string

# 3. Start database and run migrations:
pnpm db:up
pnpm --filter @hub/api prisma:migrate

# 4. Start development server:
pnpm dev
```

* Frontend running at: http://localhost:5173
* API running at: http://localhost:3000

> **AI Setup:** For local AI, run `ollama run qwen2.5:7b`. To use Claude, add your `ANTHROPIC_API_KEY` to `.env` and switch to Claude in the chat dropdown.

---

## Roadmap

* [x] **Phase 1 (Current):** Solid base, Auth, hybrid AI layer, and core modules (Notes, Anime, Books).
* [ ] **Phase 2:** Finance Module (with encryption at-rest for maximum privacy) and Audit Logging.
* [ ] **Phase 3:** Jarvis Mode — Voice commands and tool-calling so the AI can interact directly with your modules (e.g., "Add this anime to my list").
* [ ] **Phase 4:** Music module, additional hobby tools, and cloud deployment with secure AI access.