import slugify from "slugify";

export const generateBatchSlug = (
  city: string,
  batchName: string,
  year: number
) => {
  return `${city}-${slugify(batchName, {
    lower: true,
    strict: true,
  })}-${year}`;
};