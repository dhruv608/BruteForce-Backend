// src/services/leetcode.service.ts

import axios from "axios";
import { ApiError } from "../../utils/ApiError";
import prisma from "../../config/prisma";
import * as bottleneck from "bottleneck";

interface LeetcodeSubmission {
  titleSlug: string;
  statusDisplay: string;
}

interface LeetcodeResponse {
  totalSolved: number;
  submissions: LeetcodeSubmission[];
}

// Rate limiting configuration for LeetCode API
const leetcodeLimiter = new bottleneck.default({
  maxConcurrent: 1,    // Only 1 request at a time
  minTime: 300,        // 300ms between requests
});

export async function fetchLeetcodeData(
  username: string
): Promise<LeetcodeResponse> {

  const makeApiCall = async () => {
    const response = await axios.post(
      "https://leetcode.com/graphql",
      {
        query: `
          query userProfileData($username: String!) {
            matchedUser(username: $username) {
              submitStatsGlobal {
                acSubmissionNum {
                  difficulty
                  count
                }
              }
            }

            recentSubmissionList(username: $username) {
              titleSlug
              statusDisplay
            }
          }
        `,
        variables: { username }
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Referer": "https://leetcode.com",
          "Origin": "https://leetcode.com"
        },
        timeout: 15000  // 15 second timeout
      }
    );

    const data = response.data.data;

    if (!data.matchedUser) {
      throw new ApiError(400, "Invalid LeetCode username");
    }

    const stats = data.matchedUser.submitStatsGlobal.acSubmissionNum;

    const totalSolved =
      stats.find((s: any) => s.difficulty === "All")?.count || 0;

    return {
      totalSolved,
      submissions: data.recentSubmissionList
    };
  };

  // Use rate limiter with retry logic
  try {
    console.log(`[LeetCode] Fetching data for user: ${username}`);
    const result = await leetcodeLimiter.schedule(makeApiCall);
    console.log(`[LeetCode] Successfully fetched data for user: ${username}`);
    return result;
  } catch (error: any) {
    // Handle rate limiting (429) with exponential backoff
    if (error.response?.status === 429) {
      console.log(`[LeetCode] Rate limited for user: ${username}, will retry...`);
      throw new ApiError(429, "LeetCode API rate limit exceeded");
    }
    
    if (error.code === 'ECONNABORTED') {
      throw new ApiError(408, "LeetCode API request timeout");
    }
    
    console.error(`[LeetCode] Error fetching data for user: ${username}`, error);
    throw error;
  }
}


