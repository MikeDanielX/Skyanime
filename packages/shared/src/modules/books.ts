import { z } from "zod";

export const READ_STATUSES = ["READING", "COMPLETED", "PLANNED", "DROPPED"] as const;
export const readStatusSchema = z.enum(READ_STATUSES);
export type ReadStatus = z.infer<typeof readStatusSchema>;

// Input al guardar desde un resultado de Open Library.
export const bookInputSchema = z.object({
  openLibKey: z.string().min(1).max(200), // ej "/works/OL45804W"
  title: z.string().min(1).max(500),
  author: z.string().max(300).optional(),
  coverImageUrl: z.string().url().max(1000).optional(),
  status: readStatusSchema.default("PLANNED"),
  // Sección personalizada destino al guardar (el "+" de una sección custom).
  sectionId: z.string().min(1).max(64).optional(),
});
export type BookInput = z.infer<typeof bookInputSchema>;

// PATCH de una entrada. `sectionId` nullable: string = mover a esa sección;
// null = sacarlo de toda sección (vuelve a agruparse por estado).
export const bookUpdateSchema = z
  .object({
    status: readStatusSchema,
    sectionId: z.string().min(1).max(64).nullable(),
  })
  .partial();
export type BookUpdate = z.infer<typeof bookUpdateSchema>;

export interface BookEntryDTO {
  id: string;
  openLibKey: string;
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  status: ReadStatus;
  sectionId: string | null;
  createdAt: string;
}

// ─── Secciones personalizadas de libros (ej "Favoritos") ───
export const bookSectionInputSchema = z.object({
  name: z.string().trim().min(1).max(60),
});
export type BookSectionInput = z.infer<typeof bookSectionInputSchema>;

export const bookSectionUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(60),
    position: z.number().int().min(0),
  })
  .partial();
export type BookSectionUpdate = z.infer<typeof bookSectionUpdateSchema>;

// Reordenar secciones: lista de ids en el orden deseado. `position` = índice.
export const bookSectionReorderSchema = z.object({
  ids: z.array(z.string().min(1).max(64)).min(1).max(200),
});
export type BookSectionReorder = z.infer<typeof bookSectionReorderSchema>;

export interface BookSectionDTO {
  id: string;
  name: string;
  position: number;
  createdAt: string;
}

export interface BookSearchResult {
  openLibKey: string;
  title: string;
  author: string | null;
  coverImageUrl: string | null;
}
