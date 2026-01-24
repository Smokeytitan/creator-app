# Creator Contract Upload & Parsing System

## Overview

Allow users to upload creator contracts (PDF format) and automatically extract:
- Pricing information (packages, per-post costs)
- Contract terms (exclusivity, timeline)
- Deliverables (number of posts, platforms)
- Payment terms

## Architecture

### 1. Storage Strategy

**Option A: Supabase Storage (Recommended)**
- Store PDFs in Supabase Storage buckets
- Store metadata and parsed data in database
- Pros: Integrated, secure, easy access control
- Cons: Storage costs

**Option B: Local File System**
- Store PDFs locally
- Only store file path and parsed data in database
- Pros: No storage costs
- Cons: Not suitable for deployed apps

**Recommendation**: Supabase Storage for production

### 2. Parsing Strategy

**Option A: Claude API (Recommended)**
- Upload PDF to Claude API
- Use vision/document understanding to extract data
- Structured output for pricing, terms, deliverables
- Pros: Most accurate, handles complex contracts, natural language
- Cons: API costs (~$0.01-0.05 per contract)

**Option B: PDF.js + GPT-4**
- Extract text with PDF.js
- Send text to GPT-4 for structured extraction
- Pros: Good accuracy, lower cost
- Cons: Loses formatting context

**Option C: Open Source (pdfplumber + local LLM)**
- Extract text with pdfplumber
- Use local Ollama for extraction
- Pros: No API costs
- Cons: Less accurate, requires local setup

**Recommendation**: Claude API for best results

### 3. Database Schema

```sql
-- Add to creators table
ALTER TABLE creators
ADD COLUMN IF NOT EXISTS contract_file_path TEXT,
ADD COLUMN IF NOT EXISTS contract_uploaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS contract_parsed_data JSONB;

-- Create contracts table (alternative: store all contract versions)
CREATE TABLE IF NOT EXISTS creator_contracts (
  id BIGSERIAL PRIMARY KEY,
  creator_id BIGINT NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  parsed_at TIMESTAMPTZ,
  parsed_data JSONB,
  parsing_status TEXT DEFAULT 'pending' CHECK (parsing_status IN ('pending', 'processing', 'completed', 'failed')),
  parsing_error TEXT,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1
);

CREATE INDEX idx_contracts_creator ON creator_contracts(creator_id);
CREATE INDEX idx_contracts_status ON creator_contracts(parsing_status);
```

### 4. Parsed Data Structure

```json
{
  "pricing": {
    "packages": [
      {
        "name": "8 Video Package",
        "quantity": 8,
        "unitType": "video",
        "totalCost": 14000,
        "costPerUnit": 3500,
        "platforms": ["Instagram", "Facebook"],
        "description": "Each video posted to both Instagram and Facebook"
      }
    ],
    "costPerPost": 3500,
    "currency": "USD"
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
    "exclusivityDetails": "Cannot post for competing blockchain networks",
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
  },
  "rawText": "Full contract text for reference..."
}
```

## Implementation Plan

### Phase 1: Backend (Database + Storage)

1. **Migration**: Add contract columns to creators table
2. **Supabase Storage**: Set up contract-uploads bucket
3. **Service Layer**: Create `contractService.js`

### Phase 2: Parsing Service

1. **Claude Integration**: Set up Claude API client
2. **Prompt Engineering**: Design extraction prompt
3. **Service Methods**:
   - `uploadContract(file, creatorId)`
   - `parseContract(filePath)`
   - `applyParsedData(creatorId, parsedData)`

### Phase 3: Frontend UI

1. **Upload Component**: Drag-and-drop or file picker
2. **Preview Component**: Show parsed data before applying
3. **Contract Viewer**: Display uploaded contracts
4. **Integration**: Add to Add/Edit Creator forms

## User Flow

### Upload Flow
1. User clicks "Upload Contract" in creator form
2. Selects PDF file (drag-drop or file picker)
3. File uploads to Supabase Storage
4. System shows "Parsing contract..." loading state
5. Claude API extracts structured data
6. Preview shows extracted data (pricing, terms, etc.)
7. User reviews and confirms/edits
8. Data auto-fills creator form fields
9. User saves creator with contract reference

### View Flow
1. Creator card shows "📄 Contract" badge if uploaded
2. Click to view contract metadata
3. Download original PDF
4. See extracted pricing/terms
5. Re-parse if needed

## Code Structure

```
src/
├── services/
│   ├── contractService.js         # Main contract operations
│   ├── contractParser.js          # Claude API integration
│   └── contractStorage.js         # Supabase Storage operations
├── components/
│   ├── ContractUpload.jsx         # Upload UI
│   ├── ContractPreview.jsx        # Preview parsed data
│   ├── ContractViewer.jsx         # View uploaded contracts
│   └── ContractBadge.jsx          # Show contract status
└── lib/
    └── claudeClient.js            # Claude API client
```

## Cost Analysis

### Per Contract
- **Storage**: ~500KB PDF = $0.000025/month (Supabase)
- **Parsing**: ~$0.02-0.05 per contract (Claude API)
- **Total**: ~$0.02-0.05 one-time + negligible storage

### Monthly (assuming 20 new contracts/month)
- **Parsing**: $0.40-1.00/month
- **Storage**: ~$0.005/month
- **Total**: ~$0.41-1.01/month

**Very affordable!**

## Security Considerations

1. **File Validation**
   - Only accept PDF files
   - Max file size: 10MB
   - Scan for malware (optional: ClamAV)

2. **Access Control**
   - Row Level Security on contracts table
   - Signed URLs for file access (expire in 1 hour)
   - Audit logging for contract views

3. **Data Privacy**
   - Encrypt contracts at rest (Supabase default)
   - Redact sensitive info in logs
   - GDPR compliance: allow contract deletion

## Benefits

1. **Time Savings**: No manual data entry for complex pricing
2. **Accuracy**: Reduces human error in pricing setup
3. **Audit Trail**: Complete contract history per creator
4. **Compliance**: Easy to reference original contracts
5. **Flexibility**: Handles any contract format/structure

## Future Enhancements

1. **Multi-file Support**: Upload multiple contract amendments
2. **Contract Comparison**: Compare old vs new contracts
3. **Alert System**: Notify when contracts expire
4. **Batch Upload**: Upload multiple contracts at once
5. **Template Recognition**: Learn from contract patterns
6. **OCR Support**: Handle scanned contracts (non-digital PDFs)

## Alternative: Simple Implementation

If you want to start simple:

1. **Skip Storage**: Just parse and apply, don't store PDF
2. **Manual Review**: Show extracted data, user confirms before saving
3. **No History**: Single contract per creator, overwrite on new upload
4. **Basic UI**: Simple file upload button in creator form

This gets you 80% of the value with 20% of the complexity.

## Next Steps

Would you like me to:
1. **Build the full system** (storage + parsing + UI)?
2. **Start with simple version** (parsing only, no storage)?
3. **Create a prototype** (test parsing with Claude API)?

Let me know your preference!
