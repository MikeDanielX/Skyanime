# Personal AI Hub

Hub personal single-user, **modular** y con IA independiente. Cada dominio de mi vida
(notas, anime, libros, y en el futuro finanzas) es un **módulo enchufable**. Encima corre
una capa de IA que puedo cambiar entre un modelo **local** (gratis, offline) y **Claude**
(potente) con un interruptor.

Este repo es **Fase 1**: la base sólida (auth, arquitectura de módulos, capa IA, deploy-ready)
sobre la que se construyen las fases siguientes sin reescribir el core.

## Por qué está construido así (decisiones)

Este proyecto es también portfolio. Las decisiones importan tanto como el código.

### Arquitectura de módulos
Un **módulo** = carpeta autocontenida con su modelo de datos, sus rutas API y su UI. Hay un
**registro central** en back (`apps/api/src/modules/registry.ts`) y en front
(`apps/web/src/modules/registry.tsx`). Añadir un módulo = crear su carpeta + registrarlo.
El core no se toca. Esto es lo que hace el hub escalable: Fase 2 (finanzas) y los módulos
Anime/Books se enchufan igual que Notas.

### Independencia del cerebro IA — `packages/ai`
La IA **no puede ser solo Claude**. Si Claude cae, el hub no debe morir. La capa `AIProvider`
es un **enchufe/interruptor, no un filtro**: cada petición va a **UN** proveedor entero.

- `OllamaProvider` → modelo local (Qwen 7B vía Ollama). Gratis, offline, 0 tokens. **Default.**
- `ClaudeProvider` → Claude. Potente, gasta tokens.

El usuario elige el proveedor manualmente en la UI. `AIRegistry.pick(id)` enruta. La interfaz
`generate(messages) → text` es mínima a propósito — Fase 3 (Jarvis + tool-calling) se cuelga
encima sin cambiarla.

### Seguridad desde el día 1
Es un gap que quiero cerrar, así que está hecho explícito y documentado:

1. **Passwords con argon2id** (`apps/api/src/core/auth/routes.ts`). Resiste cracking por GPU
   mucho mejor que bcrypt. Nunca se guarda plaintext, solo el hash.
2. **Sesión opaca en DB, no JWT** (Lucia). Se revoca al instante borrando la fila. La cookie es
   `httpOnly` (el JS del navegador no puede leerla → anti-XSS) + `SameSite=Lax` (anti-CSRF) +
   `Secure` en producción.
3. **Validación de input en el servidor con Zod** (`packages/shared` define los schemas; la API
   los aplica en cada ruta). El cliente reusa los mismos schemas solo para feedback, **nunca**
   se confía en él.
4. **Aislamiento por usuario**: toda query filtra por `userId` de la sesión, aunque hoy el hub
   sea single-user. Así el módulo Finanzas (Fase 2) hereda el aislamiento gratis.
5. **Secrets solo en `.env`** (fuera de git, ver `.gitignore`). `core/env.ts` valida el entorno
   al arrancar y **mata el proceso** si falta algo — nunca corre a medio configurar.

Busca los comentarios `// FASE 2:` (dónde entrará cifrado at-rest) y `// FASE 3:` (dónde entrará
el tool-calling de Jarvis) para ver los puntos de extensión ya marcados.

### ¿Por qué Lucia y no Auth.js / Firebase Auth?
Lucia corre **en mi propio backend**. Veo y controlo cómo funciona la sesión (tabla, cookie,
expiry) en vez de delegar en un servicio externo. Mismo principio de independencia que el
AIProvider, y aprendo el mecanismo real de auth — que es el objetivo.

## Stack

| Capa | Elección |
|------|----------|
| Monorepo | pnpm workspaces + Turborepo |
| Frontend | React 19 + TypeScript + Vite + Tailwind (dark mode) |
| Backend | Node + TypeScript + Fastify |
| DB | Postgres + Prisma (migraciones tipadas) |
| Auth | Lucia + argon2 + cookies httpOnly/SameSite |
| IA | AIProvider → Ollama/Qwen local (default) + Claude |
| Tests | Vitest (servicios) + Supertest (API) |

## Estructura

```
apps/
  web/    React + Vite + Tailwind
  api/    Fastify + Prisma
packages/
  shared/ tipos/DTOs/contratos (fuente única de verdad front+back)
  ai/     AIProvider: interfaz + OllamaProvider + ClaudeProvider + registry
```

## Arrancar en local

Requisitos: Node ≥20, pnpm, Docker (para Postgres). Opcional: Ollama para IA local.

```bash
# 1. Instalar deps
pnpm install

# 2. Configurar entorno
cp .env.example .env        # rellena AUTH_SECRET con algo largo y aleatorio

# 3. Levantar Postgres local
pnpm db:up

# 4. Migrar DB (crea las tablas)
pnpm --filter @hub/api prisma:migrate

# 5. Arrancar todo (web :5173 + api :3000)
pnpm dev
```

Para IA local: `ollama run qwen2.5:7b` (default). Para usar Claude, pon `ANTHROPIC_API_KEY`
en `.env` y elige "Claude" en el selector del chat.

## Verificar

- Registrar usuario → login → crear una nota, cambiar su estado, borrarla.
- Chat IA: mandar mensaje con Ollama corriendo (0 tokens). Cambiar selector a Claude → responde Claude.
- Ruta protegida sin sesión devuelve 401. Cookie es httpOnly (no visible desde `document.cookie`).
- `pnpm test` (servicios + registry IA) en verde.

## Roadmap

- **Fase 1 (este repo):** base + auth + 3 módulos (Notas ✅, Anime, Books) + capa IA + deploy.
- **Fase 2:** módulo Finanzas → cifrado at-rest, audit log.
- **Fase 3:** Jarvis — voz + tool-calling (el agente actúa sobre los módulos vía tools tipados).
- **Fase 4:** infra hosting IA — acceso IA externo seguro + auditado.
