/*
  Warnings:

  - You are about to drop the column `slug` on the `City` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "City_slug_key";

-- AlterTable
ALTER TABLE "City" DROP COLUMN "slug";
