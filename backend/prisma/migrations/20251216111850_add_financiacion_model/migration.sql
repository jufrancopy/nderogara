-- CreateTable
CREATE TABLE "Financiacion" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fuente" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Financiacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Financiacion_proyectoId_idx" ON "Financiacion"("proyectoId");

-- AddForeignKey
ALTER TABLE "Financiacion" ADD CONSTRAINT "Financiacion_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
