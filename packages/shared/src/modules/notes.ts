import { z } from "zod";

export const NOTE_STATUSES = ["TODO", "DOING", "DONE"] as const;
export const noteStatusSchema = z.enum(NOTE_STATUSES);
export type NoteStatus = z.infer<typeof noteStatusSchema>;

// Input al crear/editar. Validado en servidor.
export const noteInputSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(20_000).default(""),
  status: noteStatusSchema.default("TODO"),
});
export type NoteInput = z.infer<typeof noteInputSchema>;

// Update parcial (PATCH).
export const noteUpdateSchema = noteInputSchema.partial();
export type NoteUpdate = z.infer<typeof noteUpdateSchema>;

// DTO devuelto por la API.
export interface NoteDTO {
  id: string;
  title: string;
  body: string;
  status: NoteStatus;
  createdAt: string;
  updatedAt: string;
}
