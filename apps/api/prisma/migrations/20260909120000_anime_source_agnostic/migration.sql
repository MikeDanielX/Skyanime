-- Fuente-agnóstico: reemplaza anilistId (Int) por source + externalId (String).
-- Dedup pasa de (userId, anilistId) a (userId, source, externalId).

-- DropIndex
DROP INDEX "AnimeEntry_userId_anilistId_key";

-- AlterTable
ALTER TABLE "AnimeEntry" DROP COLUMN "anilistId",
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'anilist',
ADD COLUMN     "externalId" TEXT NOT NULL DEFAULT '';

-- Quitar defaults (solo eran para poblar filas existentes; el modelo no los define).
ALTER TABLE "AnimeEntry" ALTER COLUMN "source" DROP DEFAULT;
ALTER TABLE "AnimeEntry" ALTER COLUMN "externalId" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "AnimeEntry_userId_source_externalId_key" ON "AnimeEntry"("userId", "source", "externalId");
