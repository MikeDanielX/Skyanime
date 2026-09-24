import {
  bookInputSchema,
  bookSectionInputSchema,
  bookSectionReorderSchema,
  bookSectionUpdateSchema,
  bookUpdateSchema,
  type ModuleMeta,
} from "@hub/shared";
import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { booksService, DuplicateBookError, SectionNotFoundError } from "./books.service.js";
import { BookSourceError, searchBooks } from "./books.source.js";

export const booksMeta: ModuleMeta = {
  id: "books",
  label: "Libros",
  basePath: "/books",
  icon: "BookOpen",
};

const searchQuerySchema = z.object({ q: z.string().min(1).max(100) });

export async function booksModule(app: FastifyInstance) {
  app.addHook("preHandler", app.requireAuth);

  // Buscar en Open Library. No persiste.
  app.get("/search", async (req, reply) => {
    const parsed = searchQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: "Falta el parámetro q" });
    try {
      return await searchBooks(parsed.data.q);
    } catch (err) {
      if (err instanceof BookSourceError) return reply.code(502).send({ error: err.message });
      throw err;
    }
  });

  app.get("/", async (req) => booksService.list(req.user!.id));

  // ─── Secciones personalizadas ─── (rutas estáticas antes que /:id)
  app.get("/sections", async (req) => booksService.listSections(req.user!.id));

  app.post("/sections", async (req, reply) => {
    const parsed = bookSectionInputSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Nombre inválido" });
    return reply.code(201).send(await booksService.addSection(req.user!.id, parsed.data));
  });

  // Reordenar (ruta estática, antes de /sections/:id). Devuelve la lista ordenada.
  app.patch("/sections/reorder", async (req, reply) => {
    const parsed = bookSectionReorderSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Datos inválidos" });
    return booksService.reorderSections(req.user!.id, parsed.data.ids);
  });

  app.patch("/sections/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = bookSectionUpdateSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Datos inválidos" });
    const updated = await booksService.updateSection(req.user!.id, id, parsed.data);
    if (!updated) return reply.code(404).send({ error: "Sección no encontrada" });
    return updated;
  });

  app.delete("/sections/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const ok = await booksService.removeSection(req.user!.id, id);
    if (!ok) return reply.code(404).send({ error: "Sección no encontrada" });
    return reply.code(204).send();
  });

  app.post("/", async (req, reply) => {
    const parsed = bookInputSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Datos inválidos", details: parsed.error.flatten() });
    try {
      return reply.code(201).send(await booksService.add(req.user!.id, parsed.data));
    } catch (err) {
      if (err instanceof DuplicateBookError) return reply.code(409).send({ error: err.message });
      if (err instanceof SectionNotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });

  app.patch("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = bookUpdateSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Datos inválidos" });
    try {
      const updated = await booksService.update(req.user!.id, id, parsed.data);
      if (!updated) return reply.code(404).send({ error: "Entrada no encontrada" });
      return updated;
    } catch (err) {
      if (err instanceof SectionNotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });

  app.delete("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const ok = await booksService.remove(req.user!.id, id);
    if (!ok) return reply.code(404).send({ error: "Entrada no encontrada" });
    return reply.code(204).send();
  });
}
