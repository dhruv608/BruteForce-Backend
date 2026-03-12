/*
  Warnings:

  - You are about to drop the column `username` on the `Admin` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Admin_username_key";

-- AlterTable
ALTER TABLE "Admin" DROP COLUMN "username";
