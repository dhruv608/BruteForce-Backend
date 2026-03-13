-- AlterTable
ALTER TABLE "PasswordResetOTP" ALTER COLUMN "expires_at" SET DEFAULT (now() + interval '10 minutes');
