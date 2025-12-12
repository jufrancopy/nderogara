/*
  Warnings:

  - The values [PROVEEDOR] on the enum `Rol` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "TipoInmueble" AS ENUM ('VENTA', 'ALQUILER');

-- CreateEnum
CREATE TYPE "EstadoInmueble" AS ENUM ('DISPONIBLE', 'VENDIDO', 'ALQUILADO', 'RETIRADO');

-- AlterEnum
BEGIN;
CREATE TYPE "Rol_new" AS ENUM ('ADMIN', 'CONSTRUCTOR', 'CLIENTE', 'PROVEEDOR_MATERIALES', 'PROVEEDOR_SERVICIOS');
ALTER TABLE "User" ALTER COLUMN "rol" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "rol" TYPE "Rol_new" USING ("rol"::text::"Rol_new");
ALTER TYPE "Rol" RENAME TO "Rol_old";
ALTER TYPE "Rol_new" RENAME TO "Rol";
DROP TYPE "Rol_old";
ALTER TABLE "User" ALTER COLUMN "rol" SET DEFAULT 'CLIENTE';
COMMIT;

-- CreateTable
CREATE TABLE "Inmueble" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoInmueble" NOT NULL,
    "precio" DECIMAL(12,2) NOT NULL,
    "direccion" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "departamento" TEXT,
    "superficie" DECIMAL(10,2),
    "habitaciones" INTEGER,
    "banos" INTEGER,
    "garaje" BOOLEAN NOT NULL DEFAULT false,
    "piscina" BOOLEAN NOT NULL DEFAULT false,
    "jardin" BOOLEAN NOT NULL DEFAULT false,
    "estado" "EstadoInmueble" NOT NULL DEFAULT 'DISPONIBLE',
    "imagenes" TEXT,
    "contactoNombre" TEXT NOT NULL,
    "contactoTelefono" TEXT NOT NULL,
    "contactoEmail" TEXT,
    "proyectoId" TEXT,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inmueble_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Inmueble_tipo_idx" ON "Inmueble"("tipo");

-- CreateIndex
CREATE INDEX "Inmueble_estado_idx" ON "Inmueble"("estado");

-- CreateIndex
CREATE INDEX "Inmueble_ciudad_idx" ON "Inmueble"("ciudad");

-- CreateIndex
CREATE INDEX "Inmueble_precio_idx" ON "Inmueble"("precio");

-- AddForeignKey
ALTER TABLE "Inmueble" ADD CONSTRAINT "Inmueble_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inmueble" ADD CONSTRAINT "Inmueble_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
