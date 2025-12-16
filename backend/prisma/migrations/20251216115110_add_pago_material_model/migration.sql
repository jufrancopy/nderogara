-- CreateTable
CREATE TABLE "PagoMaterial" (
    "id" TEXT NOT NULL,
    "materialPorItemId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "montoPagado" DECIMAL(12,2) NOT NULL,
    "comprobanteUrl" TEXT NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PagoMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PagoMaterial_materialPorItemId_idx" ON "PagoMaterial"("materialPorItemId");

-- CreateIndex
CREATE INDEX "PagoMaterial_materialId_idx" ON "PagoMaterial"("materialId");

-- CreateIndex
CREATE INDEX "PagoMaterial_itemId_idx" ON "PagoMaterial"("itemId");

-- CreateIndex
CREATE INDEX "PagoMaterial_proyectoId_idx" ON "PagoMaterial"("proyectoId");
