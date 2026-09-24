import type {
  BookEntryDTO,
  BookInput,
  BookSectionDTO,
  BookSectionInput,
  BookSectionUpdate,
  BookUpdate,
} from "@hub/shared";
import { Prisma } from "@prisma/client";
import { db } from "../../core/db.js";

// Servicio del módulo books. Mismo patrón que anime/notes: toda query filtra por
// userId. Dedup por (userId, openLibKey) — un libro no se guarda dos veces.

type Row = {
  id: string;
  openLibKey: string;
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  status: BookEntryDTO["status"];
  sectionId: string | null;
  createdAt: Date;
};

function toDTO(b: Row): BookEntryDTO {
  return {
    id: b.id,
    openLibKey: b.openLibKey,
    title: b.title,
    author: b.author,
    coverImageUrl: b.coverImageUrl,
    status: b.status,
    sectionId: b.sectionId,
    createdAt: b.createdAt.toISOString(),
  };
}

type SectionRow = { id: string; name: string; position: number; createdAt: Date };
function toSectionDTO(s: SectionRow): BookSectionDTO {
  return { id: s.id, name: s.name, position: s.position, createdAt: s.createdAt.toISOString() };
}

export class DuplicateBookError extends Error {}
export class SectionNotFoundError extends Error {}

// Verifica que una sección (si se especifica) pertenece al usuario.
async function assertSectionOwned(userId: string, sectionId: string): Promise<void> {
  const owned = await db.bookSection.findFirst({ where: { id: sectionId, userId } });
  if (!owned) throw new SectionNotFoundError("Sección no encontrada");
}

export const booksService = {
  async list(userId: string): Promise<BookEntryDTO[]> {
    const rows = await db.bookEntry.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return rows.map(toDTO);
  },

  async add(userId: string, input: BookInput): Promise<BookEntryDTO> {
    if (input.sectionId) await assertSectionOwned(userId, input.sectionId);
    try {
      const row = await db.bookEntry.create({
        data: {
          userId,
          openLibKey: input.openLibKey,
          title: input.title,
          author: input.author ?? null,
          coverImageUrl: input.coverImageUrl ?? null,
          status: input.status,
          sectionId: input.sectionId ?? null,
        },
      });
      return toDTO(row);
    } catch (err) {
      // P2002 = violación de unique (userId, openLibKey) → ya guardado.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new DuplicateBookError("Ese libro ya está en tu lista");
      }
      throw err;
    }
  },

  async update(userId: string, id: string, patch: BookUpdate): Promise<BookEntryDTO | null> {
    if (patch.sectionId) await assertSectionOwned(userId, patch.sectionId);
    const res = await db.bookEntry.updateMany({ where: { id, userId }, data: patch });
    if (res.count === 0) return null;
    const row = await db.bookEntry.findFirst({ where: { id, userId } });
    return row ? toDTO(row) : null;
  },

  async remove(userId: string, id: string): Promise<boolean> {
    const res = await db.bookEntry.deleteMany({ where: { id, userId } });
    return res.count > 0;
  },

  // ─── Secciones personalizadas ───
  async listSections(userId: string): Promise<BookSectionDTO[]> {
    const rows = await db.bookSection.findMany({
      where: { userId },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });
    return rows.map(toSectionDTO);
  },

  async addSection(userId: string, input: BookSectionInput): Promise<BookSectionDTO> {
    // Nueva sección arriba del todo: empuja las existentes +1 y la inserta en 0.
    const [, row] = await db.$transaction([
      db.bookSection.updateMany({ where: { userId }, data: { position: { increment: 1 } } }),
      db.bookSection.create({ data: { userId, name: input.name, position: 0 } }),
    ]);
    return toSectionDTO(row);
  },

  // Reordena TODAS las secciones del usuario según el orden de `ids`.
  async reorderSections(userId: string, ids: string[]): Promise<BookSectionDTO[]> {
    const owned = await db.bookSection.findMany({ where: { userId }, select: { id: true } });
    const ownedIds = new Set(owned.map((s) => s.id));
    const ordered = ids.filter((id) => ownedIds.has(id));
    await db.$transaction(
      ordered.map((id, i) =>
        db.bookSection.updateMany({ where: { id, userId }, data: { position: i } }),
      ),
    );
    return this.listSections(userId);
  },

  async updateSection(
    userId: string,
    id: string,
    patch: BookSectionUpdate,
  ): Promise<BookSectionDTO | null> {
    const res = await db.bookSection.updateMany({ where: { id, userId }, data: patch });
    if (res.count === 0) return null;
    const row = await db.bookSection.findFirst({ where: { id, userId } });
    return row ? toSectionDTO(row) : null;
  },

  // Borra la sección; sus libros vuelven a agruparse por estado (FK SetNull).
  async removeSection(userId: string, id: string): Promise<boolean> {
    const res = await db.bookSection.deleteMany({ where: { id, userId } });
    return res.count > 0;
  },
};
