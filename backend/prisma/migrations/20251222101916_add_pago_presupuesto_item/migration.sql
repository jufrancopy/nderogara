-- CreateTable
CREATE TABLE "PagoPresupuestoItem" (
    "id" TEXT NOT NULL,
    "presupuestoItemId" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "montoPagado" DECIMAL(12,2) NOT NULL,
    "comprobanteUrl" TEXT NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PagoPresupuestoItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PagoPresupuestoItem_presupuestoItemId_idx" ON "PagoPresupuestoItem"("presupuestoItemId");

-- CreateIndex
CREATE INDEX "PagoPresupuestoItem_proyectoId_idx" ON "PagoPresupuestoItem"("proyectoId");

-- CreateIndex
CREATE INDEX "PagoPresupuestoItem_estado_idx" ON "PagoPresupuestoItem"("estado");

-- AddForeignKey
ALTER TABLE "PagoPresupuestoItem" ADD CONSTRAINT "PagoPresupuestoItem_presupuestoItemId_fkey" FOREIGN KEY ("presupuestoItemId") REFERENCES "PresupuestoItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
