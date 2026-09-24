-- AlterTable
ALTER TABLE "AnimeEntry" ADD COLUMN     "sectionId" TEXT;

-- CreateTable
CREATE TABLE "AnimeSection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnimeSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnimeSection_userId_idx" ON "AnimeSection"("userId");

-- CreateIndex
CREATE INDEX "AnimeEntry_sectionId_idx" ON "AnimeEntry"("sectionId");

-- AddForeignKey
ALTER TABLE "AnimeEntry" ADD CONSTRAINT "AnimeEntry_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "AnimeSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimeSection" ADD CONSTRAINT "AnimeSection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
