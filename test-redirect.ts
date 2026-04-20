import axios from 'axios';

async function testRedirect() {
  const oldLink = 'https://www.geeksforgeeks.org/problems/find-difference-between-sum-of-diagonals1554/1?page=1&category=Matrix&sortBy=difficulty';
  const expectedNewLink = 'https://www.geeksforgeeks.org/problems/diagonal-sum0158/1?page=1&category=Matrix&sortBy=difficulty';

  console.log('=== TESTING REDIRECT DETECTION ===');
  console.log('Old Link:', oldLink);
  console.log('Expected New Link:', expectedNewLink);

  try {
    const response = await axios.head(oldLink, {
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: () => true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    console.log('Status Code:', response.status);
    console.log('Final URL:', response.request.res.responseUrl || 'NO REDIRECT');
    console.log('Response Headers:', response.headers);

    const finalUrl = response.request.res.responseUrl || oldLink;
    
    if (finalUrl !== oldLink) {
      console.log('✅ REDIRECT DETECTED');
      console.log('Redirect works correctly:', finalUrl === expectedNewLink);
    } else {
      console.log('❌ NO REDIRECT DETECTED');
      console.log('This might be the issue!');
    }

  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    console.error('Full error:', error);
  }
}

testRedirect();
