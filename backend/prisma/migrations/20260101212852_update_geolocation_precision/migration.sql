/*
  Warnings:

  - You are about to alter the column `latitud` on the `Proyecto` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,8)` to `Decimal(9,6)`.
  - You are about to alter the column `longitud` on the `Proyecto` table. The data in that column could be lost. The data in that column will be cast from `Decimal(11,8)` to `Decimal(10,6)`.

*/
-- AlterTable
ALTER TABLE "Proyecto" ALTER COLUMN "latitud" SET DATA TYPE DECIMAL(9,6),
ALTER COLUMN "longitud" SET DATA TYPE DECIMAL(10,6);
