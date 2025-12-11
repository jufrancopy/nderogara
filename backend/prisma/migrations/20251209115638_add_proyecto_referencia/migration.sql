-- AlterTable
ALTER TABLE "Proyecto" ADD COLUMN     "esReferencia" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Proyecto_esReferencia_idx" ON "Proyecto"("esReferencia");
