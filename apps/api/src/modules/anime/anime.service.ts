import type {
  AnimeEntryDTO,
  AnimeInput,
  AnimeSectionDTO,
  AnimeSectionInput,
  AnimeSectionReorder,
  AnimeSectionUpdate,
  AnimeSource,
  AnimeUpdate,
} from "@hub/shared";
import { Prisma } from "@prisma/client";
import { db } from "../../core/db.js";

// Servicio del módulo anime. Mismo patrón que notes: toda query filtra por userId.
// Dedup por (userId, source, externalId) — un anime no se guarda dos veces.

type Row = {
  id: string;
  source: string;
  externalId: string;
  title: string;
  coverImageUrl: string | null;
  bannerImageUrl: string | null;
  status: AnimeEntryDTO["status"];
  score: number | null;
  sectionId: string | null;
  createdAt: Date;
};

function toDTO(a: Row): AnimeEntryDTO {
  return {
    id: a.id,
    source: a.source as AnimeSource,
    externalId: a.externalId,
    title: a.title,
    coverImageUrl: a.coverImageUrl,
    bannerImageUrl: a.bannerImageUrl,
    status: a.status,
    score: a.score,
    sectionId: a.sectionId,
    createdAt: a.createdAt.toISOString(),
  };
}

type SectionRow = { id: string; name: string; position: number; createdAt: Date };
function toSectionDTO(s: SectionRow): AnimeSectionDTO {
  return { id: s.id, name: s.name, position: s.position, createdAt: s.createdAt.toISOString() };
}

export class DuplicateEntryError extends Error {}
export class SectionNotFoundError extends Error {}

// Verifica que una sección (si se especifica) pertenece al usuario. Evita que un
// usuario asigne su anime a la sección de otro pasando un sectionId ajeno.
async function assertSectionOwned(userId: string, sectionId: string): Promise<void> {
  const owned = await db.animeSection.findFirst({ where: { id: sectionId, userId } });
  if (!owned) throw new SectionNotFoundError("Sección no encontrada");
}

export const animeService = {
  async list(userId: string): Promise<AnimeEntryDTO[]> {
    const rows = await db.animeEntry.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return rows.map(toDTO);
  },

  async add(userId: string, input: AnimeInput): Promise<AnimeEntryDTO> {
    if (input.sectionId) await assertSectionOwned(userId, input.sectionId);
    try {
      const row = await db.animeEntry.create({
        data: {
          userId,
          source: input.source,
          externalId: input.externalId,
          title: input.title,
          coverImageUrl: input.coverImageUrl ?? null,
          bannerImageUrl: input.bannerImageUrl ?? null,
          status: input.status,
          score: input.score ?? null,
          sectionId: input.sectionId ?? null,
        },
      });
      return toDTO(row);
    } catch (err) {
      // P2002 = violación de unique (userId, source, externalId) → ya guardado.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new DuplicateEntryError("Ese anime ya está en tu lista");
      }
      throw err;
    }
  },

  async update(userId: string, id: string, patch: AnimeUpdate): Promise<AnimeEntryDTO | null> {
    // sectionId presente y no-null → validar propiedad antes de asignar.
    if (patch.sectionId) await assertSectionOwned(userId, patch.sectionId);
    const res = await db.animeEntry.updateMany({ where: { id, userId }, data: patch });
    if (res.count === 0) return null;
    const row = await db.animeEntry.findFirst({ where: { id, userId } });
    return row ? toDTO(row) : null;
  },

  async remove(userId: string, id: string): Promise<boolean> {
    const res = await db.animeEntry.deleteMany({ where: { id, userId } });
    return res.count > 0;
  },

  // ─── Secciones personalizadas ───
  async listSections(userId: string): Promise<AnimeSectionDTO[]> {
    const rows = await db.animeSection.findMany({
      where: { userId },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });
    return rows.map(toSectionDTO);
  },

  async addSection(userId: string, input: AnimeSectionInput): Promise<AnimeSectionDTO> {
    // Nueva sección arriba del todo: empuja las existentes +1 y la inserta en 0.
    // Transacción → posiciones nunca quedan a medias.
    const [, row] = await db.$transaction([
      db.animeSection.updateMany({ where: { userId }, data: { position: { increment: 1 } } }),
      db.animeSection.create({ data: { userId, name: input.name, position: 0 } }),
    ]);
    return toSectionDTO(row);
  },

  // Reordena TODAS las secciones del usuario según el orden de `ids`. Solo aplica
  // a las que le pertenecen (filtra por userId) → position = índice en la lista.
  async reorderSections(userId: string, ids: string[]): Promise<AnimeSectionDTO[]> {
    const owned = await db.animeSection.findMany({ where: { userId }, select: { id: true } });
    const ownedIds = new Set(owned.map((s) => s.id));
    const ordered = ids.filter((id) => ownedIds.has(id)); // descarta ajenos/inexistentes
    await db.$transaction(
      ordered.map((id, i) =>
        db.animeSection.updateMany({ where: { id, userId }, data: { position: i } }),
      ),
    );
    return this.listSections(userId);
  },

  async updateSection(
    userId: string,
    id: string,
    patch: AnimeSectionUpdate,
  ): Promise<AnimeSectionDTO | null> {
    const res = await db.animeSection.updateMany({ where: { id, userId }, data: patch });
    if (res.count === 0) return null;
    const row = await db.animeSection.findFirst({ where: { id, userId } });
    return row ? toSectionDTO(row) : null;
  },

  // Borra la sección; sus animes vuelven a agruparse por estado (FK SetNull).
  async removeSection(userId: string, id: string): Promise<boolean> {
    const res = await db.animeSection.deleteMany({ where: { id, userId } });
    return res.count > 0;
  },
};
