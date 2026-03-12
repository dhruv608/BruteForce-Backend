/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Batch` will be added. If there are existing duplicate values, this will fail.

*/

-- Step 1: Add slug column as nullable
ALTER TABLE "Batch" ADD COLUMN "slug" VARCHAR(100);

-- Step 2: Populate existing batches with slugs (format: cityname-batchname-year)
UPDATE "Batch" 
SET "slug" = LOWER(REPLACE(REPLACE(REPLACE(
    (SELECT city_name FROM "City" WHERE "City".id = "Batch".city_id) || '-' || batch_name || '-' || year,
    ' ', '-'), '--', '-'), '--', '-'
))
WHERE "slug" IS NULL;

-- Step 3: Make slug column NOT NULL
ALTER TABLE "Batch" ALTER COLUMN "slug" SET NOT NULL;

-- Step 4: Create unique index
CREATE UNIQUE INDEX "Batch_slug_key" ON "Batch"("slug");
