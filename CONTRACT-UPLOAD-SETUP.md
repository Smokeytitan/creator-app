# Contract Upload Feature - Setup Guide

## Quick Start

The contract upload feature is now live in the Creator Roster! Upload a PDF contract and Claude will automatically extract pricing, deliverables, terms, and payment information.

## Setup Steps

### 1. Get Your Claude API Key

1. Go to [https://console.anthropic.com](https://console.anthropic.com)
2. Sign in or create an account
3. Navigate to API Keys
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)

### 2. Add API Key to Environment

Add this to your `.env.production` file:

```bash
VITE_CLAUDE_API_KEY=sk-ant-your-api-key-here
```

### 3. That's It!

The feature is ready to use. No database migrations needed (the pricing packages migration from earlier is sufficient).

## How to Use

### Upload a Contract

1. Open the Creator Roster
2. Click the **"Upload Contract"** button (next to Import CSV)
3. Select a PDF contract
4. Wait while Claude parses it (~5-10 seconds)
5. Review the extracted data in the preview modal
6. Click "Apply to Creator" to auto-fill the data

### What Gets Extracted

**Pricing**
- Package deals (e.g., "8 videos for $14,000")
- Cost per post/video
- Platforms included

**Deliverables**
- Total number of posts
- Platforms (Instagram, Facebook, X, etc.)
- Content type (video, photo, story)
- Posting frequency

**Terms**
- Contract duration (start/end dates)
- Exclusivity clauses
- Revision allowances
- Approval process

**Payment**
- Payment schedule (Net 30, etc.)
- Payment milestones (upfront, upon completion)
- Payment method

### What Gets Applied

When you click "Apply to Creator":
- ✅ **Pricing packages** are added automatically
- ✅ **Cost per post** is set
- ✅ **Platforms** are updated
- ✅ **Contract terms** are added to notes

## Example: Wendy O's Contract

If you upload Wendy O's contract with:
- 8 videos for $14,000
- Posted to Instagram + Facebook

Claude will extract:
```json
{
  "pricing": {
    "packages": [{
      "name": "8 Video Package",
      "quantity": 8,
      "totalCost": 14000,
      "costPerUnit": 3500,
      "platforms": ["Instagram", "Facebook"]
    }]
  }
}
```

And auto-fill:
- Cost per post: $3,500.00
- Pricing package: 8 Video Package
- Platforms: Instagram, Facebook

## Cost

Very affordable:
- **~$0.02-0.05 per contract**
- Example: 20 contracts/month = ~$0.40-1.00/month

## Troubleshooting

### "Claude API key not configured"
- Make sure you added `VITE_CLAUDE_API_KEY` to `.env.production`
- Restart your dev server after adding the key

### "Failed to parse contract"
- Ensure the file is a valid PDF
- Check that the PDF isn't password-protected
- Try a different PDF to test

### "Only PDF files are supported"
- Currently only PDF contracts are supported
- Convert Word/Google Docs to PDF first

### Contract data looks wrong
- Claude does its best but isn't perfect
- You can manually edit the data in the preview before applying
- Complex contracts may need manual review

## Advanced: Per-Creator Contract Upload

Currently, the button uploads a contract globally. To upload for a specific creator:

1. Edit the creator card UI to add a contract button
2. Pass the `creatorId` to `handleContractUpload`
3. The system will automatically apply to that specific creator

Example:
```jsx
<button onClick={(e) => {
  e.stopPropagation();
  contractInputRef.current?.click();
  setContractCreatorId(creator.id);
}}>
  Upload Contract
</button>
```

## Files Added

- `src/lib/claudeClient.js` - Claude API integration
- `src/services/contractService.js` - Contract parsing and application logic
- Updated `src/components/CreatorRoster.jsx` - UI and upload handler

## Next Steps

1. Add Claude API key to your `.env`
2. Test with a sample contract
3. (Optional) Add per-creator upload buttons
4. (Optional) Store contract PDFs in Supabase Storage for reference

Enjoy automated contract parsing! 🎉
