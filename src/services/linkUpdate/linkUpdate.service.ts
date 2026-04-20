import axios from 'axios';
import prisma from '../../config/prisma';

interface QuestionLinkUpdate {
  id: number;
  question_link: string;
  new_link?: string;
  should_update: boolean;
}

export class LinkUpdateService {
  private static readonly MAX_REDIRECTS = 5;
  private static readonly REQUEST_TIMEOUT = 10000; // 10 seconds
  private static readonly BATCH_SIZE = 50;

  /**
   * Follow redirects to get the final URL
   */
  static async followRedirect(url: string): Promise<string> {
    try {
      const response = await axios.head(url, {
        timeout: this.REQUEST_TIMEOUT,
        maxRedirects: this.MAX_REDIRECTS,
        validateStatus: () => true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      // Return the final URL after all redirects
      return response.request.res.responseUrl || url;
    } catch (error: any) {
      console.log(`[LINK_UPDATE] Failed to follow redirect for ${url}:`, error.message);
      return url; // Return original if redirect fails
    }
  }

  /**
   * Update all question links in the database
   */
  static async updateAllQuestionLinks(): Promise<{
    updated: number;
    skipped: number;
    failed: number;
    total: number;
  }> {
    console.log('[LINK_UPDATE] Starting question link update process...');
    
    try {
      // Fetch all questions from database
      const allQuestions = await prisma.question.findMany({
        select: {
          id: true,
          question_link: true
        }
      });

      console.log(`[LINK_UPDATE] Found ${allQuestions.length} questions to process`);

      let updated = 0;
      let skipped = 0;
      let failed = 0;

      // Process in batches to avoid memory issues
      for (let i = 0; i < allQuestions.length; i += this.BATCH_SIZE) {
        const batch = allQuestions.slice(i, i + this.BATCH_SIZE);
        console.log(`[LINK_UPDATE] Processing batch ${Math.floor(i / this.BATCH_SIZE) + 1}/${Math.ceil(allQuestions.length / this.BATCH_SIZE)}`);

        const batchResults = await Promise.allSettled(
          batch.map(async (question) => {
            try {
              const newLink = await this.followRedirect(question.question_link);
              
              const shouldUpdate = newLink !== question.question_link;
              
              if (shouldUpdate) {
                console.log(`[LINK_UPDATE] Question ${question.id}: ${question.question_link} → ${newLink}`);
                return {
                  id: question.id,
                  question_link: question.question_link,
                  new_link: newLink,
                  should_update: true
                };
              } else {
                console.log(`[LINK_UPDATE] Question ${question.id}: No redirect needed`);
                return {
                  id: question.id,
                  question_link: question.question_link,
                  should_update: false
                };
              }
            } catch (error: any) {
              console.error(`[LINK_UPDATE] Error processing question ${question.id}:`, error);
              return {
                id: question.id,
                question_link: question.question_link,
                should_update: false
              };
            }
          })
        );

        // Separate successful and failed updates
        const updates: QuestionLinkUpdate[] = [];
        batchResults.forEach((result: any) => {
          if (result.status === 'fulfilled') {
            if (result.value.should_update === true) {
              updates.push(result.value);
            } else {
              skipped++;
            }
          } else if (result.status === 'rejected') {
            failed++;
          }
        });

        // Batch update questions that need new links
        if (updates.length > 0) {
          console.log(`[LINK_UPDATE] Processing ${updates.length} updates`);

          const dbUpdateResults = await Promise.allSettled(
            updates.map(async (update) => {
              try {
                await prisma.question.update({
                  where: { id: update.id },
                  data: { question_link: update.new_link! }
                });
                return { success: true, id: update.id };
              } catch (error: any) {
                // Handle unique constraint violation gracefully
                if (error.code === 'P2002') {
                  console.log(`[LINK_UPDATE] Skipping question ${update.id} - target link already exists: ${update.new_link}`);
                  return { success: false, id: update.id, error: 'duplicate_link', skipped: true };
                } else {
                  console.error(`[LINK_UPDATE] Failed to update question ${update.id}:`, error);
                  return { success: false, id: update.id, error };
                }
              }
            })
          );

          // Count successful and failed database updates
          dbUpdateResults.forEach((result) => {
            if (result.status === 'fulfilled') {
              if (result.value.success) {
                updated++;
              } else if (result.value.skipped) {
                skipped++;
              } else {
                failed++;
              }
            } else {
              failed++;
            }
          });
        }

        // Small delay between batches to be respectful
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const total = allQuestions.length;
      
      console.log(`[LINK_UPDATE] Question link update completed:`);
      console.log(`  - Updated: ${updated}`);
      console.log(`  - Skipped: ${skipped}`);
      console.log(`  - Failed: ${failed}`);
      console.log(`  - Total: ${total}`);

      return { updated, skipped, failed, total };

    } catch (error: any) {
      console.error('[LINK_UPDATE] Critical error in update process:', error);
      throw error;
    }
  }

  /**
   * Generate completion report
   */
  static generateReport(results: { updated: number; skipped: number; failed: number; total: number }) {
    console.log('\n=== QUESTION LINK UPDATE REPORT ===');
    console.log(`Questions Updated: ${results.updated}`);
    console.log(`Questions Skipped: ${results.skipped}`);
    console.log(`Questions Failed: ${results.failed}`);
    console.log(`Total Questions Processed: ${results.total}`);
    console.log(`Success Rate: ${((results.updated / results.total) * 100).toFixed(1)}%`);
    console.log('=====================================\n');
  }
}
