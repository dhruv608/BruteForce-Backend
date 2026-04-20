import prisma from './src/config/prisma';

async function findDuplicateQuestions() {
  console.log('=== FINDING DUPLICATE QUESTIONS ===');
  
  try {
    // Find questions that have the same slug (after extracting from URL)
    const duplicateSlugs = await prisma.$queryRaw`
      WITH CTE_ExtractedSlugs AS (
        SELECT 
          id,
          question_link,
          CASE 
            WHEN question_link LIKE '/problems/%' THEN 
              SPLIT_PART(question_link, '/problems/', 2)::text
            WHEN question_link LIKE '%/problems/%' THEN 
              SPLIT_PART(question_link, '/problems/', 2)::text
            ELSE question_link
          END as slug
        FROM "Question"
        WHERE platform = 'GFG'
      ),
      CTE_Duplicates AS (
        SELECT 
          slug,
          COUNT(*) as count,
          ARRAY_AGG(id) as question_ids,
          ARRAY_AGG(question_link) as links
        FROM CTE_ExtractedSlugs
        GROUP BY slug
        HAVING COUNT(*) > 1
      )
      SELECT 
        slug,
        count,
        question_ids,
        links
      FROM CTE_Duplicates
      ORDER BY count DESC, slug
    ` as { slug: string; count: number; question_ids: number[]; links: string[] }[];

    console.log(`Found ${duplicateSlugs.length} duplicate slug groups:`);
    
    duplicateSlugs.forEach((duplicate, index) => {
      console.log(`\n${index + 1}. Slug: ${duplicate.slug}`);
      console.log(`   Count: ${duplicate.count}`);
      console.log(`   Question IDs: [${duplicate.question_ids.join(', ')}]`);
      console.log(`   Links:`);
      duplicate.links.forEach((link, i) => {
        console.log(`     ${i + 1}. ${link}`);
      });
    });

    // Specifically check for diagonal-sum vs find-difference-between-sum-of-diagonals
    const diagonalSumQuestions = await prisma.$queryRaw`
      SELECT id, question_link, question_name
      FROM "Question"
      WHERE (question_link LIKE '%diagonal-sum%' OR question_link LIKE '%find-difference-between-sum-of-diagonals%')
      AND platform = 'GFG'
      ORDER BY id
    ` as { id: number; question_link: string; question_name: string }[];

    console.log('\n=== DIAGONAL SUM RELATED QUESTIONS ===');
    diagonalSumQuestions.forEach(q => {
      console.log(`ID: ${q.id} | Name: ${q.question_name}`);
      console.log(`Link: ${q.question_link}`);
      console.log('---');
    });

  } catch (error: any) {
    console.error('❌ Error finding duplicates:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

findDuplicateQuestions();
