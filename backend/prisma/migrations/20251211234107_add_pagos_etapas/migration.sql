-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');

-- CreateTable
CREATE TABLE "PagoEtapa" (
    "id" TEXT NOT NULL,
    "etapaId" TEXT NOT NULL,
    "itemId" TEXT,
    "monto" DECIMAL(12,2) NOT NULL,
    "comprobanteUrl" TEXT,
    "fechaPago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PagoEtapa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PagoEtapa_etapaId_idx" ON "PagoEtapa"("etapaId");

-- CreateIndex
CREATE INDEX "PagoEtapa_itemId_idx" ON "PagoEtapa"("itemId");

-- CreateIndex
CREATE INDEX "PagoEtapa_estado_idx" ON "PagoEtapa"("estado");

-- AddForeignKey
ALTER TABLE "PagoEtapa" ADD CONSTRAINT "PagoEtapa_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "EtapaObra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoEtapa" ADD CONSTRAINT "PagoEtapa_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
