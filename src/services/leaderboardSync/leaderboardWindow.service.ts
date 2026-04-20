import { syncLeaderboardData } from './sync-core.service';
import { isSyncRunning, getSyncCompletionTime } from '../../utils/syncStatus';

// Leaderboard window logic with sync status awareness
export async function tryRunLeaderboard(): Promise<void> {
  const MAX_WAIT = 20 * 60 * 1000; // 20 minutes in milliseconds
  const INTERVAL = 3 * 60 * 1000;   // 3 minutes in milliseconds
  let waited = 0;

  console.log('[LEADERBOARD] Starting leaderboard sync with window logic');

  while (waited < MAX_WAIT) {
    const TESTING_MODE =true;
    // Check if sync is not running AND has completed at least once
    if ( TESTING_MODE || (!isSyncRunning() && getSyncCompletionTime() !== null) ){
      try {
        console.log('[LEADERBOARD] Sync is complete, running leaderboard update');
        const result = await syncLeaderboardData();
        console.log(`[LEADERBOARD] Leaderboard sync completed successfully. Processed ${result.studentsProcessed} students`);
        return;
      } catch (error) {
        console.error('[LEADERBOARD] Leaderboard sync failed:', error);
        throw error;
      }
    } else {
      console.log(`[LEADERBOARD] Sync still running or not completed. Waiting ${INTERVAL / 1000} seconds... (${waited / 1000}s elapsed)`);
      await new Promise(resolve => setTimeout(resolve, INTERVAL));
      waited += INTERVAL;
    }
  }

  // If we reach here, we've waited the maximum time
  console.log('[LEADERBOARD] Max wait time reached, skipping leaderboard cycle');
  console.log(`[LEADERBOARD] Sync status: isRunning=${isSyncRunning()}, completedAt=${getSyncCompletionTime()?.toISOString() || 'never'}`);
}
