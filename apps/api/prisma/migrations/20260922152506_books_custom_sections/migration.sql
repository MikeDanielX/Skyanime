-- AlterTable
ALTER TABLE "BookEntry" ADD COLUMN     "sectionId" TEXT;

-- CreateTable
CREATE TABLE "BookSection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookSection_userId_idx" ON "BookSection"("userId");

-- CreateIndex
CREATE INDEX "BookEntry_sectionId_idx" ON "BookEntry"("sectionId");

-- AddForeignKey
ALTER TABLE "BookEntry" ADD CONSTRAINT "BookEntry_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "BookSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookSection" ADD CONSTRAINT "BookSection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
