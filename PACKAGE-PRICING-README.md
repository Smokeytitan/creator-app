# Package Pricing Enhancement

## Overview

Enhanced the Influencer Campaign Manager to support flexible package pricing deals. This allows creators to offer packages like "8 videos for $14,000" with multi-platform posting.

## Use Case: Wendy O

**Problem**: Wendy O charges $14,000 for 8 videos, where each video is posted to both Instagram AND Facebook for $3,500.

**Solution**: Added `pricing_packages` JSONB field to store flexible package deals alongside the existing `cost_per_post` field.

## Implementation

### 1. Database Migration

**File**: `supabase/migrations/002_add_pricing_packages.sql`

Adds a `pricing_packages` JSONB column to the `creators` table with GIN indexing for efficient queries.

**To apply**:
1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `002_add_pricing_packages.sql`
3. Run the query

### 2. Service Layer Updates

**File**: `src/services/creatorsServiceSupabase.js`

**Added**:
- `pricingPackages` field to `transformFromDB` and `transformToDB`
- `addPricingPackage(creatorId, packageData)` - Add new package
- `updatePricingPackage(creatorId, packageId, updates)` - Update existing package
- `deletePricingPackage(creatorId, packageId)` - Remove package
- `getEffectiveCostPerPost(creator)` - Get effective cost (from package or cost_per_post)

### 3. Update Script

**File**: `update-wendy-pricing-simple.mjs`

Simple script to update Wendy O with package pricing.

**To run**:
```bash
node update-wendy-pricing-simple.mjs
```

## Package Data Structure

```javascript
{
  id: 1234567890,                // Unique ID (timestamp)
  name: "8 Video Package",       // Package name
  description: "Each video posted to both Instagram and Facebook",
  quantity: 8,                   // Number of units
  unitType: "video",             // Type: 'post', 'video', 'story', etc.
  totalCost: 14000,              // Total package cost
  costPerUnit: 3500,             // Cost per unit
  platforms: ["Instagram", "Facebook"], // Platforms included
  notes: "Must purchase both platforms together" // Additional notes
}
```

## Usage Examples

### Adding a Package to a Creator

```javascript
import { addPricingPackage } from './services/creatorsServiceSupabase';

await addPricingPackage(creatorId, {
  name: '8 Video Package',
  description: 'Each video posted to both Instagram and Facebook',
  quantity: 8,
  unitType: 'video',
  totalCost: 14000,
  costPerUnit: 3500,
  platforms: ['Instagram', 'Facebook'],
  notes: 'Must purchase both platforms together'
});
```

### Getting Effective Cost Per Post

```javascript
import { getEffectiveCostPerPost } from './services/creatorsServiceSupabase';

const creator = await getCreatorById(123);
const cost = getEffectiveCostPerPost(creator);
// Returns: "$3,500.00" (from package) or cost_per_post if no packages
```

## Benefits

1. **Flexibility**: Supports complex pricing structures (bundles, packages, multi-platform deals)
2. **Backwards Compatible**: Existing `cost_per_post` field still works
3. **Scalable**: Can add multiple packages per creator
4. **Future-Proof**: JSONB allows adding new fields without schema changes

## Future Enhancements

### UI Components (Not Yet Implemented)

To fully integrate this feature, you'll need to add:

1. **Roster Component**: Display package pricing in creator cards
   ```jsx
   {creator.pricingPackages && creator.pricingPackages.length > 0 && (
     <div className="packages">
       {creator.pricingPackages.map(pkg => (
         <div key={pkg.id} className="package-badge">
           {pkg.name} - ${pkg.totalCost.toLocaleString()}
         </div>
       ))}
     </div>
   )}
   ```

2. **Add/Edit Creator Form**: Add package pricing fields
   - Package name
   - Quantity and unit type
   - Total cost and per-unit cost
   - Platforms included
   - Description/notes

3. **Campaign Cost Calculator**: Use package pricing when calculating campaign costs
   ```javascript
   const calculateCampaignCost = (creator, quantity) => {
     if (creator.pricingPackages && creator.pricingPackages.length > 0) {
       const pkg = creator.pricingPackages[0];
       return pkg.costPerUnit * quantity;
     }
     return parseFloat(creator.costPerPost.replace(/[$,]/g, '')) * quantity;
   };
   ```

## Step-by-Step Setup

1. **Run the migration**:
   ```sql
   -- Copy from supabase/migrations/002_add_pricing_packages.sql
   -- and run in Supabase SQL Editor
   ```

2. **Update Wendy O**:
   ```bash
   cd /Users/ntruslow/projects/content-requests-app
   node update-wendy-pricing-simple.mjs
   ```

3. **Verify in Supabase**:
   - Go to Table Editor → creators
   - Find Wendy O
   - Check `pricing_packages` column

4. **(Optional) Update UI components** to display and edit packages

## Notes

- The `cost_per_post` field is kept for backwards compatibility
- Creators can have multiple packages (e.g., "3-post package", "10-post package")
- Package pricing is stored as JSONB for flexibility
- Use `getEffectiveCostPerPost()` to get the display price

## Questions?

The service layer is fully functional. UI updates are optional and can be added incrementally as needed.
