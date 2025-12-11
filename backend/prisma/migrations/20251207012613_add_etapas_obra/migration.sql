-- CreateEnum
CREATE TYPE "EstadoEtapa" AS ENUM ('PENDIENTE', 'EN_PROGRESO', 'COMPLETADA', 'ATRASADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "EtapaObra" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL,
    "fechaInicioPlaneada" TIMESTAMP(3),
    "fechaFinPlaneada" TIMESTAMP(3),
    "fechaInicioReal" TIMESTAMP(3),
    "fechaFinReal" TIMESTAMP(3),
    "estado" "EstadoEtapa" NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EtapaObra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialExtraEtapa" (
    "id" TEXT NOT NULL,
    "etapaId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "cantidad" DECIMAL(10,4) NOT NULL,
    "costoUnitario" DECIMAL(10,2) NOT NULL,
    "costoTotal" DECIMAL(12,2) NOT NULL,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialExtraEtapa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EtapaObra_proyectoId_idx" ON "EtapaObra"("proyectoId");

-- CreateIndex
CREATE INDEX "EtapaObra_orden_idx" ON "EtapaObra"("orden");

-- CreateIndex
CREATE INDEX "MaterialExtraEtapa_etapaId_idx" ON "MaterialExtraEtapa"("etapaId");

-- AddForeignKey
ALTER TABLE "EtapaObra" ADD CONSTRAINT "EtapaObra_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialExtraEtapa" ADD CONSTRAINT "MaterialExtraEtapa_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "EtapaObra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialExtraEtapa" ADD CONSTRAINT "MaterialExtraEtapa_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
