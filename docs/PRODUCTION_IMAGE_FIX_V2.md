# Production Image Loading Fix - Version 2

## Problem
After deployment, images for trucks (Eicher 2059XP, Eicher Pro 1075 F HSD, Tata 609g, Tata 709g LPT) were not visible because the mapping JSON files were not accessible in production builds.

## Root Cause
The API routes were trying to read mapping files from `process.cwd()` (root directory), but in production builds, these files might not be included in the build output or accessible at runtime.

## Solution Applied

### 1. Copy Mapping Files to Public Folder
All image mapping JSON files are now copied to the `public/` folder, which ensures they're always accessible in production:
- `eicher-2059xp-image-mapping.json`
- `eicher-pro-1075-f-hsd-image-mapping.json`
- `tata-609g-image-mapping.json`
- `tata-709g-lpt-image-mapping.json`
- `tata-1109g-image-mapping.json`
- `tata-1412-image-mapping.json`
- `ashok-leyland-image-mapping.json`
- `ashok-leyland-1615-image-mapping.json`
- `mahindra-bolero-image-mapping.json`
- `sml-isuzu-image-mapping.json`

### 2. Updated API Routes to Check Multiple Locations
Modified both API routes to check multiple file locations:
- **Primary**: Root directory (`process.cwd()/filename.json`) - works in development
- **Fallback**: Public folder (`process.cwd()/public/filename.json`) - always accessible in production

**Files Updated:**
- `app/api/truck-images/route.ts`
- `app/api/truck-images/[truckName]/route.ts`

### 3. Improved Error Handling
The API now:
- Tries root directory first (faster in dev)
- Falls back to public folder if root file doesn't exist
- Provides better error logging for debugging
- Still falls back to Supabase Storage if mapping files aren't found

## How It Works

```typescript
// Try multiple locations: root directory first, then public folder
const possiblePaths = [
  join(process.cwd(), fileName), // Root directory (works in dev)
  join(process.cwd(), 'public', fileName), // Public folder (always accessible in production)
]

for (const mappingFile of possiblePaths) {
  if (existsSync(mappingFile)) {
    // Read and return URLs from mapping file
  }
}
```

## Verification

After deployment, images should load correctly because:
1. ✅ Mapping files are in `public/` folder (always included in build)
2. ✅ API routes check both root and public folder locations
3. ✅ Fallback to Supabase Storage if mapping files aren't found
4. ✅ Better error logging for debugging production issues

## Next Steps

1. **Deploy the changes** - The mapping files in `public/` will be included in the build
2. **Verify in production** - Check that images load correctly for:
   - Eicher 2059XP
   - Eicher Pro 1075 F HSD
   - Tata 609g
   - Tata 709g LPT
3. **Check browser console** - If images still don't load, check for API errors in the console

## Files Changed

1. `app/api/truck-images/route.ts` - Updated `loadImagesFromMapping()` function
2. `app/api/truck-images/[truckName]/route.ts` - Updated `loadImagesFromMapping()` function
3. `public/*-image-mapping.json` - All mapping files copied to public folder
