import prisma from './src/config/prisma';
import { LinkUpdateService } from './src/services/linkUpdate/linkUpdate.service';

async function debugQuestion833() {
  console.log('=== DEBUGGING QUESTION 833 ===');
  
  try {
    // Get current question data
    const question = await prisma.question.findUnique({
      where: { id: 833 },
      select: {
        id: true,
        question_link: true,
        question_name: true
      }
    });

    if (!question) {
      console.log('❌ Question 833 not found');
      return;
    }

    console.log('Current Question 833:');
    console.log('  ID:', question.id);
    console.log('  Name:', question.question_name);
    console.log('  Link:', question.question_link);

    // Test redirect for this specific question
    const newLink = await LinkUpdateService.followRedirect(question.question_link);
    console.log('Redirect Result:', newLink);
    console.log('Should Update:', newLink !== question.question_link);

    if (newLink !== question.question_link) {
      console.log('🔄 UPDATING QUESTION 833...');
      try {
        await prisma.question.update({
          where: { id: 833 },
          data: { question_link: newLink }
        });
        console.log('✅ Question 833 updated successfully');
      } catch (error: any) {
        console.error('❌ Failed to update question 833:', error.message);
      }
    } else {
      console.log('ℹ️ No update needed for question 833');
    }

    // Verify the update
    const updatedQuestion = await prisma.question.findUnique({
      where: { id: 833 },
      select: { question_link: true }
    });

    console.log('Final Question 833 Link:', updatedQuestion?.question_link);

  } catch (error: any) {
    console.error('❌ Debug error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugQuestion833();
