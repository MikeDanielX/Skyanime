import type { NoteDTO, NoteInput, NoteUpdate } from "@hub/shared";
import { db } from "../../core/db.js";

// Servicio: lógica de datos del módulo notes. Testeable sin HTTP.
// REGLA DE ORO de seguridad: TODA query filtra por userId de la sesión. Aunque
// el hub es single-user hoy, el aislamiento por usuario es obligatorio — así el
// módulo Finanzas (FASE 2) hereda el patrón gratis y nada se filtra entre datos.

type Row = {
  id: string;
  title: string;
  body: string;
  status: NoteDTO["status"];
  createdAt: Date;
  updatedAt: Date;
};

function toDTO(n: Row): NoteDTO {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    status: n.status,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  };
}

export const notesService = {
  async list(userId: string): Promise<NoteDTO[]> {
    const rows = await db.note.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
    return rows.map(toDTO);
  },

  async create(userId: string, input: NoteInput): Promise<NoteDTO> {
    // FASE 2: si `body` fuese sensible, se cifraría at-rest aquí antes de persistir.
    const row = await db.note.create({ data: { ...input, userId } });
    return toDTO(row);
  },

  async update(userId: string, id: string, patch: NoteUpdate): Promise<NoteDTO | null> {
    // updateMany con userId en el where → no se puede editar nota de otro usuario.
    const res = await db.note.updateMany({ where: { id, userId }, data: patch });
    if (res.count === 0) return null;
    const row = await db.note.findFirst({ where: { id, userId } });
    return row ? toDTO(row) : null;
  },

  async remove(userId: string, id: string): Promise<boolean> {
    const res = await db.note.deleteMany({ where: { id, userId } });
    return res.count > 0;
  },
};
