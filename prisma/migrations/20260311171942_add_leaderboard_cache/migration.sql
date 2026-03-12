/*
  Warnings:

  - You are about to drop the column `updated_at` on the `Leaderboard` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Leaderboard" DROP COLUMN "updated_at",
ADD COLUMN     "city_rank" INTEGER,
ADD COLUMN     "easy_completion" DECIMAL(5,2),
ADD COLUMN     "filters_hash" VARCHAR(64),
ADD COLUMN     "global_rank" INTEGER,
ADD COLUMN     "hard_completion" DECIMAL(5,2),
ADD COLUMN     "last_calculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "medium_completion" DECIMAL(5,2),
ADD COLUMN     "score" DECIMAL(10,2),
ADD COLUMN     "total_solved" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Leaderboard_global_rank_idx" ON "Leaderboard"("global_rank");

-- CreateIndex
CREATE INDEX "Leaderboard_score_idx" ON "Leaderboard"("score");

-- CreateIndex
CREATE INDEX "Leaderboard_last_calculated_idx" ON "Leaderboard"("last_calculated");
