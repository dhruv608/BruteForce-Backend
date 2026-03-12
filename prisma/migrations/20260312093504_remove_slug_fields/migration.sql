/*
  Warnings:

  - You are about to drop the column `slug` on the `Batch` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Batch_slug_key";

-- AlterTable
ALTER TABLE "Batch" DROP COLUMN "slug";
