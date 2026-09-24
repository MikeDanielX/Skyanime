import { noteInputSchema, noteUpdateSchema, type ModuleMeta } from "@hub/shared";
import type { FastifyInstance } from "fastify";
import { notesService } from "./notes.service.js";

export const notesMeta: ModuleMeta = {
  id: "notes",
  label: "Notas",
  basePath: "/notes",
  icon: "StickyNote",
};

// Plugin Fastify del módulo notes. Autocontenido: se registra bajo /notes.
// Todas las rutas exigen sesión (requireAuth) y usan req.user.id.
export async function notesModule(app: FastifyInstance) {
  app.addHook("preHandler", app.requireAuth);

  app.get("/", async (req) => notesService.list(req.user!.id));

  app.post("/", async (req, reply) => {
    const parsed = noteInputSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Datos inválidos", details: parsed.error.flatten() });
    return reply.code(201).send(await notesService.create(req.user!.id, parsed.data));
  });

  app.patch("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = noteUpdateSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Datos inválidos" });
    const updated = await notesService.update(req.user!.id, id, parsed.data);
    if (!updated) return reply.code(404).send({ error: "Nota no encontrada" });
    return updated;
  });

  app.delete("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const ok = await notesService.remove(req.user!.id, id);
    if (!ok) return reply.code(404).send({ error: "Nota no encontrada" });
    return reply.code(204).send();
  });
}
