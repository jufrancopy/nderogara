-- AlterTable
ALTER TABLE "Proveedor" ADD COLUMN     "ciudad" TEXT,
ADD COLUMN     "departamento" TEXT,
ADD COLUMN     "latitud" DECIMAL(10,8),
ADD COLUMN     "longitud" DECIMAL(11,8);

-- AlterTable
ALTER TABLE "Proyecto" ADD COLUMN     "ciudad" TEXT,
ADD COLUMN     "departamento" TEXT,
ADD COLUMN     "latitud" DECIMAL(10,8),
ADD COLUMN     "longitud" DECIMAL(11,8);

-- CreateIndex
CREATE INDEX "Proveedor_ciudad_idx" ON "Proveedor"("ciudad");

-- CreateIndex
CREATE INDEX "Proveedor_departamento_idx" ON "Proveedor"("departamento");

-- CreateIndex
CREATE INDEX "Proyecto_ciudad_idx" ON "Proyecto"("ciudad");

-- CreateIndex
CREATE INDEX "Proyecto_departamento_idx" ON "Proyecto"("departamento");
