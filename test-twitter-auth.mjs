/**
 * Twitter API Authentication Test Script
 *
 * This script tests if the Twitter bearer token is valid by making a simple API request.
 * Run with: VITE_TWITTER_BEARER_TOKEN=your_token node test-twitter-auth.mjs
 */

const bearerToken = process.env.VITE_TWITTER_BEARER_TOKEN;

if (!bearerToken) {
  console.error('❌ VITE_TWITTER_BEARER_TOKEN not found in environment variables');
  console.log('\nTo fix:');
  console.log('1. Create a .env file in the project root');
  console.log('2. Add: VITE_TWITTER_BEARER_TOKEN=your_token_here');
  process.exit(1);
}

console.log('🔍 Testing Twitter API authentication...\n');
console.log(`Token (first 20 chars): ${bearerToken.substring(0, 20)}...`);
console.log(`Token length: ${bearerToken.length} characters\n`);

// Test with a known public tweet ID
const testTweetId = '1882220003803017246';
const url = `https://api.twitter.com/2/tweets?ids=${testTweetId}&tweet.fields=created_at,text,public_metrics,author_id`;

try {
  console.log(`Testing endpoint: ${url}\n`);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      'Content-Type': 'application/json'
    }
  });

  console.log(`Response status: ${response.status} ${response.statusText}\n`);

  const data = await response.json();

  if (response.ok) {
    console.log('✅ SUCCESS! Twitter API authentication is working.\n');
    console.log('Tweet data:', JSON.stringify(data, null, 2));
  } else {
    console.log('❌ AUTHENTICATION FAILED\n');
    console.log('Error details:', JSON.stringify(data, null, 2));
    console.log('\nPossible causes:');
    console.log('1. Bearer token is expired or revoked');
    console.log('2. App doesn\'t have proper API access level');
    console.log('3. Token is from wrong Twitter app/project');
    console.log('4. App doesn\'t have "Read" permissions enabled');
    console.log('\nTo fix:');
    console.log('1. Go to: https://developer.x.com/en/portal/dashboard');
    console.log('2. Select your app');
    console.log('3. Go to "Keys and tokens" tab');
    console.log('4. Click "Regenerate" under Bearer Token');
    console.log('5. Copy the new token');
    console.log('6. Update .env file with new token');
    console.log('7. Redeploy to Vercel: vercel env add VITE_TWITTER_BEARER_TOKEN production');
  }
} catch (error) {
  console.error('❌ Network or request error:', error.message);
}
