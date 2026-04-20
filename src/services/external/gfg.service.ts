import axios from "axios";

import { ApiError } from "../../utils/ApiError";

import * as bottleneck from "bottleneck";



interface GfgApiResponse {
  status: string;
  result: Record<string, Record<string, any>>;
  count: number;
}



interface GfgFormattedResponse {
  totalSolved: number;
  solvedSlugs: string[];
}



// Rate limiting configuration for GFG API

const gfgLimiter = new bottleneck.default({
  maxConcurrent: 1,    // Only 1 request at a time
  minTime: 500,        // 500ms between requests

});



export async function fetchGfgData(
  handle: string
): Promise<GfgFormattedResponse> {



  const makeApiCall = async () => {

    const response = await axios.post<GfgApiResponse>(

      "https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/",

      { handle },

      {

        headers: {

          "Content-Type": "application/json",

          "User-Agent": "Mozilla/5.0"

        },

        timeout: 15000  // 15 second timeout

      }

    );



    const data = response.data;



    if (data.status !== "success") {

      throw new ApiError(400, "Invalid GFG handle");

    }



    const totalSolved = data.count;



    const solvedSlugs: string[] = [];



    // result contains: Easy, Medium, Hard, Basic

    for (const difficulty in data.result) {



      const problemsObject = data.result[difficulty];



      // Each difficulty contains problemId as key

      for (const problemId in problemsObject) {



        const problem = problemsObject[problemId];



        if (problem.slug) {

          solvedSlugs.push(problem.slug);

        }



      }

    }



    return {

      totalSolved,

      solvedSlugs

    };

  };



  // Use rate limiter with retry logic

  try {

    console.log(`[GFG] Fetching data for user: ${handle}`);

    const result = await gfgLimiter.schedule(makeApiCall);

    console.log(`[GFG] Successfully fetched data for user: ${handle}`);

    return result;

  } catch (error: any) {

    // Handle rate limiting (429) with exponential backoff

    if (error.response?.status === 429) {

      console.log(`[GFG] Rate limited for user: ${handle}, will retry...`);

      throw new ApiError(429, "GFG API rate limit exceeded");

    }

    

    if (error.code === 'ECONNABORTED') {

      throw new ApiError(408, "GFG API request timeout");

    }

    

    // Handle 406 Not Acceptable (Invalid User Details)

    if (error.response?.status === 406) {

      console.log(`[GFG] Invalid user or 406 for user: ${handle}`);

      throw new ApiError(400, "Invalid GFG handle");

    }



    console.error(`[GFG] Error fetching data for user: ${handle}`, error._message || error.message);

    throw error;

  }

}