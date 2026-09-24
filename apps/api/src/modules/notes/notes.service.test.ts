import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock del cliente Prisma — el test valida la LÓGICA del servicio (filtrado por
// userId, mapeo a DTO), no la DB real. Test rápido, sin Postgres.
const noteDb = {
  findMany: vi.fn(),
  create: vi.fn(),
  updateMany: vi.fn(),
  findFirst: vi.fn(),
  deleteMany: vi.fn(),
};
vi.mock("../../core/db.js", () => ({ db: { note: noteDb } }));

const { notesService } = await import("./notes.service.js");

const row = {
  id: "n1",
  title: "Comprar pan",
  body: "",
  status: "TODO" as const,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-02T00:00:00Z"),
};

beforeEach(() => vi.clearAllMocks());

describe("notesService", () => {
  it("list() filtra por userId y mapea a DTO con fechas ISO", async () => {
    noteDb.findMany.mockResolvedValue([row]);
    const res = await notesService.list("user-1");
    expect(noteDb.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { updatedAt: "desc" },
    });
    expect(res[0]).toMatchObject({ id: "n1", createdAt: "2026-01-01T00:00:00.000Z" });
  });

  it("create() inyecta userId de la sesión", async () => {
    noteDb.create.mockResolvedValue(row);
    await notesService.create("user-1", { title: "x", body: "", status: "TODO" });
    expect(noteDb.create).toHaveBeenCalledWith({
      data: { title: "x", body: "", status: "TODO", userId: "user-1" },
    });
  });

  it("update() devuelve null si la nota no es del usuario", async () => {
    noteDb.updateMany.mockResolvedValue({ count: 0 });
    const res = await notesService.update("user-1", "n1", { status: "DONE" });
    expect(res).toBeNull();
    expect(noteDb.findFirst).not.toHaveBeenCalled();
  });

  it("remove() devuelve false si no borró nada", async () => {
    noteDb.deleteMany.mockResolvedValue({ count: 0 });
    expect(await notesService.remove("user-1", "n1")).toBe(false);
  });
});
