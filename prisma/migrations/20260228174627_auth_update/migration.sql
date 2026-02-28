-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "refresh_token" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'google',
ADD COLUMN     "refresh_token" TEXT;
