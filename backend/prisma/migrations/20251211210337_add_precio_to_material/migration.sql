/*
  Warnings:

  - You are about to drop the column `precioPersonalizado` on the `Material` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Material" DROP COLUMN "precioPersonalizado",
ADD COLUMN     "precio" DECIMAL(10,2);
