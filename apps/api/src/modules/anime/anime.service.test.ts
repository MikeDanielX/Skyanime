import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const animeDb = {
  findMany: vi.fn(),
  create: vi.fn(),
  updateMany: vi.fn(),
  findFirst: vi.fn(),
  deleteMany: vi.fn(),
};
vi.mock("../../core/db.js", () => ({ db: { animeEntry: animeDb } }));

const { animeService, DuplicateEntryError } = await import("./anime.service.js");

const row = {
  id: "a1",
  source: "anilist",
  externalId: "5114",
  title: "Fullmetal Alchemist: Brotherhood",
  coverImageUrl: null,
  status: "PLANNED" as const,
  score: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

beforeEach(() => vi.clearAllMocks());

describe("animeService", () => {
  it("list() filtra por userId y mapea DTO", async () => {
    animeDb.findMany.mockResolvedValue([row]);
    const res = await animeService.list("user-1");
    expect(animeDb.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { createdAt: "desc" },
    });
    expect(res[0]).toMatchObject({
      source: "anilist",
      externalId: "5114",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("add() traduce P2002 a DuplicateEntryError", async () => {
    animeDb.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "5" }),
    );
    await expect(
      animeService.add("user-1", { source: "anilist", externalId: "5114", title: "x", status: "PLANNED" }),
    ).rejects.toBeInstanceOf(DuplicateEntryError);
  });

  it("update() devuelve null si no es del usuario", async () => {
    animeDb.updateMany.mockResolvedValue({ count: 0 });
    expect(await animeService.update("user-1", "a1", { status: "COMPLETED" })).toBeNull();
  });
});
