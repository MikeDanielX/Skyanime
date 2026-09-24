import {
  animeInputSchema,
  animeSectionInputSchema,
  animeSectionReorderSchema,
  animeSectionUpdateSchema,
  animeUpdateSchema,
  type ModuleMeta,
} from "@hub/shared";
import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { animeService, DuplicateEntryError, SectionNotFoundError } from "./anime.service.js";
import { AnimeSourceError, searchAnime } from "./anime.source.js";
import { enrichWithTmdb } from "./tmdb.source.js";

export const animeMeta: ModuleMeta = {
  id: "anime",
  label: "Anime",
  basePath: "/anime",
  icon: "Tv",
};

const searchQuerySchema = z.object({ q: z.string().min(1).max(100) });

export async function animeModule(app: FastifyInstance) {
  app.addHook("preHandler", app.requireAuth);

  // Buscar en fuente externa (AniList → Kitsu fallback). No persiste.
  app.get("/search", async (req, reply) => {
    const parsed = searchQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: "Falta el parámetro q" });
    try {
      const results = await searchAnime(parsed.data.q);
      // Enriquecer con imágenes de TMDB (póster+backdrop). No-op si no hay token
      // y nunca lanza: ante fallo de TMDB devuelve los resultados sin tocar.
      return await enrichWithTmdb(results);
    } catch (err) {
      if (err instanceof AnimeSourceError) return reply.code(502).send({ error: err.message });
      throw err;
    }
  });

  app.get("/", async (req) => animeService.list(req.user!.id));

  // ─── Secciones personalizadas ─── (rutas estáticas antes que /:id)
  app.get("/sections", async (req) => animeService.listSections(req.user!.id));

  app.post("/sections", async (req, reply) => {
    const parsed = animeSectionInputSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Nombre inválido" });
    return reply.code(201).send(await animeService.addSection(req.user!.id, parsed.data));
  });

  // Reordenar (ruta estática, antes de /sections/:id). Devuelve la lista ordenada.
  app.patch("/sections/reorder", async (req, reply) => {
    const parsed = animeSectionReorderSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Datos inválidos" });
    return animeService.reorderSections(req.user!.id, parsed.data.ids);
  });

  app.patch("/sections/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = animeSectionUpdateSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Datos inválidos" });
    const updated = await animeService.updateSection(req.user!.id, id, parsed.data);
    if (!updated) return reply.code(404).send({ error: "Sección no encontrada" });
    return updated;
  });

  app.delete("/sections/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const ok = await animeService.removeSection(req.user!.id, id);
    if (!ok) return reply.code(404).send({ error: "Sección no encontrada" });
    return reply.code(204).send();
  });

  app.post("/", async (req, reply) => {
    const parsed = animeInputSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Datos inválidos", details: parsed.error.flatten() });
    try {
      return reply.code(201).send(await animeService.add(req.user!.id, parsed.data));
    } catch (err) {
      if (err instanceof DuplicateEntryError) return reply.code(409).send({ error: err.message });
      if (err instanceof SectionNotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });

  app.patch("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = animeUpdateSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Datos inválidos" });
    try {
      const updated = await animeService.update(req.user!.id, id, parsed.data);
      if (!updated) return reply.code(404).send({ error: "Entrada no encontrada" });
      return updated;
    } catch (err) {
      if (err instanceof SectionNotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });

  app.delete("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const ok = await animeService.remove(req.user!.id, id);
    if (!ok) return reply.code(404).send({ error: "Entrada no encontrada" });
    return reply.code(204).send();
  });
}
