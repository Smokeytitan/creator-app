# Contract Upload - Simple Version (No Claude API Required!)

## Quick Start

The contract upload feature works in **TWO MODES**:

### Mode 1: Simple Upload (No API Key Needed) ⚡
- Upload PDF to Supabase Storage
- Manually enter pricing data
- **Cost: FREE** (just Supabase storage)

### Mode 2: Auto-Parse (Optional, requires Claude API) 🤖
- Upload PDF to Supabase Storage
- Claude automatically extracts pricing
- **Cost: ~$0.02-0.05 per contract**

## Setup (Simple Mode - No API Key)

### 1. Run Database Migration

Go to Supabase SQL Editor:

```sql
ALTER TABLE creators
ADD COLUMN IF NOT EXISTS contract_file_path TEXT,
ADD COLUMN IF NOT EXISTS contract_uploaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS contract_parsed_data JSONB;

CREATE INDEX IF NOT EXISTS idx_creators_has_contract ON creators(contract_file_path)
  WHERE contract_file_path IS NOT NULL;
```

### 2. That's It!

The app will auto-create the storage bucket on first upload.

## How To Use

### Upload a Contract (Simple Mode)

1. Open Creator Roster
2. Click **"Upload Contract"** button
3. Select Wendy O's PDF
4. Wait ~2 seconds for upload
5. You'll see: "Contract uploaded successfully! You can now manually update the creator with pricing info."
6. Click on the creator to edit
7. Manually enter:
   - Cost per post: `$3,500.00`
   - Platforms: Instagram, Facebook
   - Notes: "8 videos for $14,000 package"

### What Gets Stored

When you upload a contract:
- ✅ PDF stored in Supabase Storage
- ✅ File path saved with creator
- ✅ Upload timestamp recorded
- ✅ Ready for manual data entry

### Where's the PDF?

Supabase Storage:
```
creator-contracts/
└── creator_123/
    └── 1234567890_wendyo_contract.pdf
```

## (Optional) Enable Auto-Parsing

Want Claude to automatically extract pricing? Add this to `.env.production`:

```bash
VITE_CLAUDE_API_KEY=sk-ant-your-api-key-here
```

Get your key at: [https://console.anthropic.com](https://console.anthropic.com)

With Claude API:
- ✅ Auto-extracts pricing packages
- ✅ Auto-extracts platforms
- ✅ Auto-extracts terms
- ✅ Shows preview before applying
- ❗ Costs ~$0.02-0.05 per contract

Without Claude API:
- ✅ Still uploads to Supabase
- ✅ Still stores contract reference
- ✅ Manual data entry (free)
- ✅ No ongoing costs

## Cost Comparison

### Simple Mode (No Claude API)
- Upload: FREE
- Storage: FREE (1GB free tier)
- Data entry: Manual
- **Total: $0/month**

### Auto-Parse Mode (With Claude API)
- Upload: FREE
- Storage: FREE (1GB free tier)
- Parsing: ~$0.02-0.05 per contract
- **Total: ~$0.40-1.00/month (for 20 contracts)**

## Benefits of Simple Mode

✅ **Zero cost** - No API fees
✅ **Instant setup** - No API key needed
✅ **Secure storage** - PDFs safe in Supabase
✅ **Audit trail** - Track when contracts uploaded
✅ **Full control** - You enter the data manually

## When to Add Claude API

Consider adding Claude API if:
- You upload contracts frequently (>5/month)
- Contracts have complex pricing structures
- You want to save time on data entry
- You're okay with ~$0.02-0.05 per contract cost

Don't need Claude API if:
- You upload contracts rarely
- Simple pricing structures (easy to enter manually)
- You prefer full control over data
- You want zero ongoing costs

## Example: Wendy O's Contract

**Without Claude API:**
1. Upload PDF → Stored in Supabase ✅
2. Edit Wendy O's profile:
   - Cost per post: `$3,500.00`
   - Add package pricing (use the package feature we built)
   - Platforms: Instagram, Facebook
3. Done! ✅

**With Claude API:**
1. Upload PDF → Stored in Supabase ✅
2. Claude extracts automatically:
   - 8 videos for $14,000
   - $3,500 per video
   - Instagram + Facebook
3. Preview → Apply → Done! ✅

## Summary

**You can start using contract upload TODAY without any API key!**

Just upload the PDF, and manually enter the pricing data. The contract is safely stored in Supabase for your records.

Later, if you want automation, add the Claude API key and the system will automatically extract the data for you.

---

**Ready to try?** Just click "Upload Contract" and select a PDF! 📄
