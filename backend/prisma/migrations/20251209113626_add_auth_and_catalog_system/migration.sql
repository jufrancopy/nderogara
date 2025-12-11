-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "usuarioId" TEXT;

-- AlterTable
ALTER TABLE "Material" ADD COLUMN     "comisionPorcentaje" DECIMAL(5,2),
ADD COLUMN     "esCatalogo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "urlProveedor" TEXT,
ADD COLUMN     "usuarioId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT;

-- CreateIndex
CREATE INDEX "Item_usuarioId_idx" ON "Item"("usuarioId");

-- CreateIndex
CREATE INDEX "Material_esCatalogo_idx" ON "Material"("esCatalogo");

-- CreateIndex
CREATE INDEX "Material_usuarioId_idx" ON "Material"("usuarioId");

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
