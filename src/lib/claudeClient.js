/**
 * Claude API Client
 * Handles contract parsing using Claude's document understanding
 */

const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Parse a PDF file using Claude API
 * @param {File} file - PDF file object
 * @returns {Promise<object>} Parsed contract data
 */
export async function parseContractWithClaude(file) {
  if (!CLAUDE_API_KEY) {
    throw new Error('Claude API key not configured. Add VITE_CLAUDE_API_KEY to your .env file');
  }

  // Convert PDF to base64
  const base64Data = await fileToBase64(file);

  const prompt = `You are a contract analysis assistant. Extract structured data from this creator contract PDF.

Extract the following information and return it as JSON:

1. **Creator Information**:
   - Creator's full legal name (as it appears on the contract)
   - Creator's legal address (full address including street, city, state, zip)
   - Creator's business/company name if different from personal name
   - Creator's email address
   - Creator's wallet address (cryptocurrency wallet if specified)

2. **Pricing Information**:
   - Any package deals (e.g., "8 videos for $14,000")
   - Cost per post/video/content piece
   - Currency (USD, EUR, etc.)
   - PO number (Purchase Order number if specified)

3. **Deliverables**:
   - Total number of posts/videos/content pieces
   - Platforms (Instagram, Facebook, X/Twitter, TikTok, YouTube, etc.)
   - Content type (video, photo, story, reel, etc.)
   - Posting frequency if specified
   - Campaign duration

4. **Contract Terms**:
   - Start date
   - End date
   - Exclusivity clause (yes/no and details)
   - Number of revisions allowed
   - Approval process details

5. **Payment Terms**:
   - Payment schedule (Net 30, Net 60, etc.)
   - Payment milestones (upfront, upon completion, etc.)
   - Payment method

Return ONLY valid JSON in this exact structure:
{
  "creatorInfo": {
    "legalName": "Creator's full legal name",
    "legalAddress": "Full legal address including street, city, state, zip",
    "businessName": "Business name if applicable",
    "email": "creator@example.com",
    "walletAddress": "0x... or crypto wallet address if specified"
  },
  "pricing": {
    "packages": [
      {
        "name": "Package name",
        "quantity": 8,
        "unitType": "video",
        "totalCost": 14000,
        "costPerUnit": 3500,
        "platforms": ["Instagram", "Facebook"],
        "description": "Brief description"
      }
    ],
    "costPerPost": 3500,
    "currency": "USD",
    "poNumber": "PO-12345"
  },
  "deliverables": {
    "totalPosts": 8,
    "platforms": ["Instagram", "Facebook"],
    "contentType": "video",
    "frequency": "weekly",
    "duration": "2 months"
  },
  "terms": {
    "startDate": "2025-01-01",
    "endDate": "2025-03-01",
    "exclusivity": true,
    "exclusivityDetails": "Details here",
    "revisions": 2,
    "approvalProcess": "48 hour turnaround"
  },
  "payment": {
    "schedule": "Net 30",
    "milestones": [
      {"description": "50% upfront", "amount": 7000},
      {"description": "50% upon completion", "amount": 7000}
    ],
    "method": "Wire transfer"
  }
}

If any information is not found in the contract, use null for that field. Be as accurate as possible.`;

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64Data
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
    }

    const result = await response.json();
    const content = result.content[0].text;

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    if (content.includes('```json')) {
      jsonStr = content.match(/```json\n([\s\S]*?)\n```/)?.[1] || content;
    } else if (content.includes('```')) {
      jsonStr = content.match(/```\n([\s\S]*?)\n```/)?.[1] || content;
    }

    const parsedData = JSON.parse(jsonStr.trim());

    return {
      success: true,
      data: parsedData,
      raw: content
    };
  } catch (error) {
    console.error('Error parsing contract:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

/**
 * Convert File to base64 string
 * @param {File} file - File object
 * @returns {Promise<string>} Base64 string (without data URI prefix)
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove data URI prefix (data:application/pdf;base64,)
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default {
  parseContractWithClaude
};
