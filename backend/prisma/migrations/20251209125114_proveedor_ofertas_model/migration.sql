/*
  Warnings:

  - You are about to drop the column `comisionPorcentaje` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `esCatalogo` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `fechaActualizacion` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `marca` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `observaciones` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `precioUnitario` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `proveedor` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `stockMinimo` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `telefonoProveedor` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `tipoCalidad` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `urlProveedor` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the `HistorialPrecio` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "Rol" ADD VALUE 'PROVEEDOR';

-- DropForeignKey
ALTER TABLE "HistorialPrecio" DROP CONSTRAINT "HistorialPrecio_materialId_fkey";

-- DropIndex
DROP INDEX "Material_esCatalogo_idx";

-- DropIndex
DROP INDEX "Material_proveedor_idx";

-- AlterTable
ALTER TABLE "Material" DROP COLUMN "comisionPorcentaje",
DROP COLUMN "esCatalogo",
DROP COLUMN "fechaActualizacion",
DROP COLUMN "marca",
DROP COLUMN "observaciones",
DROP COLUMN "precioUnitario",
DROP COLUMN "proveedor",
DROP COLUMN "stockMinimo",
DROP COLUMN "telefonoProveedor",
DROP COLUMN "tipoCalidad",
DROP COLUMN "urlProveedor",
ADD COLUMN     "descripcion" TEXT,
ADD COLUMN     "precioPersonalizado" DECIMAL(10,2);

-- DropTable
DROP TABLE "HistorialPrecio";

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "sitioWeb" TEXT,
    "logo" TEXT,
    "esActivo" BOOLEAN NOT NULL DEFAULT true,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfertaProveedor" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "tipoCalidad" "TipoCalidad" NOT NULL DEFAULT 'COMUN',
    "marca" TEXT,
    "comisionPorcentaje" DECIMAL(5,2) NOT NULL,
    "stock" BOOLEAN NOT NULL DEFAULT true,
    "vigenciaHasta" TIMESTAMP(3),
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfertaProveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialPrecioOferta" (
    "id" TEXT NOT NULL,
    "ofertaId" TEXT NOT NULL,
    "precioAnterior" DECIMAL(10,2) NOT NULL,
    "precioNuevo" DECIMAL(10,2) NOT NULL,
    "fechaCambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo" TEXT,

    CONSTRAINT "HistorialPrecioOferta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_email_key" ON "Proveedor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_usuarioId_key" ON "Proveedor"("usuarioId");

-- CreateIndex
CREATE INDEX "Proveedor_nombre_idx" ON "Proveedor"("nombre");

-- CreateIndex
CREATE INDEX "OfertaProveedor_materialId_idx" ON "OfertaProveedor"("materialId");

-- CreateIndex
CREATE INDEX "OfertaProveedor_proveedorId_idx" ON "OfertaProveedor"("proveedorId");

-- CreateIndex
CREATE INDEX "OfertaProveedor_precio_idx" ON "OfertaProveedor"("precio");

-- CreateIndex
CREATE UNIQUE INDEX "OfertaProveedor_materialId_proveedorId_key" ON "OfertaProveedor"("materialId", "proveedorId");

-- AddForeignKey
ALTER TABLE "Proveedor" ADD CONSTRAINT "Proveedor_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfertaProveedor" ADD CONSTRAINT "OfertaProveedor_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfertaProveedor" ADD CONSTRAINT "OfertaProveedor_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialPrecioOferta" ADD CONSTRAINT "HistorialPrecioOferta_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "OfertaProveedor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
