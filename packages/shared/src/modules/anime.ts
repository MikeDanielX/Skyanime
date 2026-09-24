import { z } from "zod";

export const WATCH_STATUSES = ["WATCHING", "COMPLETED", "PLANNED", "DROPPED"] as const;
export const watchStatusSchema = z.enum(WATCH_STATUSES);
export type WatchStatus = z.infer<typeof watchStatusSchema>;

// Fuentes soportadas. AniList primaria; Kitsu fallback (independencia de fuente).
export const ANIME_SOURCES = ["anilist", "kitsu"] as const;
export const animeSourceSchema = z.enum(ANIME_SOURCES);
export type AnimeSource = z.infer<typeof animeSourceSchema>;

// Input al guardar. externalId es string (Kitsu usa ids string; AniList se coacciona).
export const animeInputSchema = z.object({
  source: animeSourceSchema,
  externalId: z.string().min(1).max(64),
  title: z.string().min(1).max(500),
  coverImageUrl: z.string().url().max(1000).optional(),
  // Banner ancho (wallpaper) — distinto del póster vertical. AniList bannerImage,
  // Kitsu coverImage. Se usa en el hero; el póster es para las filas/grid.
  bannerImageUrl: z.string().url().max(1000).optional(),
  status: watchStatusSchema.default("PLANNED"),
  score: z.number().int().min(0).max(100).optional(),
  // Sección personalizada destino al guardar (el "+" de una sección custom).
  sectionId: z.string().min(1).max(64).optional(),
});
export type AnimeInput = z.infer<typeof animeInputSchema>;

// PATCH de una entrada. `sectionId` nullable: string = mover a esa sección;
// null = sacarlo de toda sección (vuelve a agruparse por estado). `.nullable()`
// (no `.optional()` a secas) permite mandar null explícito para desasignar.
export const animeUpdateSchema = z
  .object({
    status: watchStatusSchema,
    score: z.number().int().min(0).max(100),
    sectionId: z.string().min(1).max(64).nullable(),
  })
  .partial();
export type AnimeUpdate = z.infer<typeof animeUpdateSchema>;

export interface AnimeEntryDTO {
  id: string;
  source: AnimeSource;
  externalId: string;
  title: string;
  coverImageUrl: string | null;
  bannerImageUrl: string | null;
  status: WatchStatus;
  score: number | null;
  sectionId: string | null;
  createdAt: string;
}

// ─── Secciones personalizadas (ej "Top 10") ───
// Nombre 1-60 chars. `position` reordena las filas (Fase 1: solo append, sin UI de
// reordenar, pero el contrato ya lo soporta).
export const animeSectionInputSchema = z.object({
  name: z.string().trim().min(1).max(60),
});
export type AnimeSectionInput = z.infer<typeof animeSectionInputSchema>;

export const animeSectionUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(60),
    position: z.number().int().min(0),
  })
  .partial();
export type AnimeSectionUpdate = z.infer<typeof animeSectionUpdateSchema>;

// Reordenar secciones: lista de ids en el orden deseado. `position` = índice.
export const animeSectionReorderSchema = z.object({
  ids: z.array(z.string().min(1).max(64)).min(1).max(200),
});
export type AnimeSectionReorder = z.infer<typeof animeSectionReorderSchema>;

export interface AnimeSectionDTO {
  id: string;
  name: string;
  position: number;
  createdAt: string;
}

// Resultado de búsqueda externa — no persistido hasta guardar.
export interface AnimeSearchResult {
  source: AnimeSource;
  externalId: string;
  title: string;
  coverImageUrl: string | null;
  bannerImageUrl: string | null;
}
