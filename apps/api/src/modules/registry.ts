import type { FastifyInstance } from "fastify";
import type { ModuleMeta } from "@hub/shared";
import { notesModule, notesMeta } from "./notes/notes.routes.js";
import { animeModule, animeMeta } from "./anime/anime.routes.js";
import { booksModule, booksMeta } from "./books/books.routes.js";

// ── Registro central de módulos (backend) ──
// Añadir un módulo = crear su carpeta con un plugin Fastify + meta, e importarlo
// aquí. El core NO se toca. Cada módulo se monta bajo su basePath.
//
// FASE 6/7 (plan): anime y books se añaden aquí igual que notes, reusando el
// "media layer" (buscar externo → guardar → listar con estado).
interface RegisteredModule {
  meta: ModuleMeta;
  plugin: (app: FastifyInstance) => Promise<void>;
}

const MODULES: RegisteredModule[] = [
  { meta: notesMeta, plugin: notesModule },
  { meta: animeMeta, plugin: animeModule },
  { meta: booksMeta, plugin: booksModule },
];

export async function registerModules(app: FastifyInstance) {
  for (const m of MODULES) {
    await app.register(m.plugin, { prefix: m.meta.basePath });
  }
}

// Expuesto para que el frontend pinte la nav dinámicamente vía GET /modules.
export const moduleManifest: ModuleMeta[] = MODULES.map((m) => m.meta);
