# Production Image Loading Fix

## Problem
- Old images work fine in production
- New images (from Supabase Storage) don't load in production
- Reports section not visible in production

## Root Cause
Next.js Image component tries to optimize external Supabase URLs in production, which can fail due to:
1. Image optimization service limitations
2. CORS issues during optimization
3. Timeout issues with external URLs

## Solution Applied

### 1. Use Regular `<img>` Tags for External URLs
Changed all Image components to use regular `<img>` tags for external Supabase URLs:
- `components/TruckCard.tsx` - Uses `<img>` for external images
- `app/truck/[id]/page.tsx` - Gallery and thumbnails use `<img>` for external images
- Similar trucks section uses `<img>` for external images

### 2. Conditional Rendering
External images (Supabase URLs) now use:
```tsx
{isExternalImage(src) ? (
  <img src={src} ... />
) : (
  <Image src={src} ... />
)}
```

### 3. Reports Section
Reports are conditionally rendered based on exact truck name match:
- ASHOK LEYLAND ECOMET STAR 1615 HE
- Mahindra Bolero Maxitruck Plus
- SML Isuzu Samrat 4760gs
- Tata 1412 LPT

**Important**: Make sure truck names in database match exactly (case-sensitive).

## Verification Steps

1. **Check Database Truck Names**:
   ```bash
   node check-mahindra-bolero-truck.js
   node check-sml-isuzu-truck.js
   node check-tata-1412-truck.js
   node check-ashok-leyland-1615-truck.js
   ```

2. **Verify Image URLs**:
   - Check that `image_url` in database contains full Supabase URLs
   - URLs should start with: `https://ccmlkidiwxmqxzexoeji.supabase.co/storage/v1/object/public/truck-images/`

3. **Test in Browser Console**:
   ```javascript
   // Open browser console on deployed site
   // Check if images are loading
   document.querySelectorAll('img[src*="supabase"]').forEach(img => {
     console.log(img.src, img.complete ? '✅ Loaded' : '❌ Failed')
   })
   ```

## Files Changed

1. `components/TruckCard.tsx` - Uses `<img>` for external images
2. `app/truck/[id]/page.tsx` - Gallery uses `<img>` for external images
3. `next.config.js` - Enhanced Supabase image configuration

## Deployment Checklist

- [x] All Image components updated to use `<img>` for external URLs
- [x] Next.js config has Supabase hostname in remotePatterns
- [ ] Verify truck names in database match exactly
- [ ] Test image URLs directly in browser
- [ ] Check browser console for image loading errors
- [ ] Verify Supabase Storage bucket is public

## If Images Still Don't Load

1. **Check Browser Console**:
   - Open DevTools → Console
   - Look for image loading errors
   - Check Network tab for failed image requests

2. **Verify Supabase Storage**:
   - Go to Supabase Dashboard → Storage
   - Check `truck-images` bucket is public
   - Test image URL directly in browser

3. **Verify Database URLs**:
   - Check `image_url` field in trucks table
   - Ensure URLs are complete Supabase Storage URLs
   - URLs should be accessible when opened directly

4. **Check Reports Section**:
   - Verify truck name in database matches exactly
   - Check browser console for any JavaScript errors
   - Ensure Quality Report tab is selected

## Expected Behavior

After deployment:
- ✅ All images should load (both old and new)
- ✅ Reports section should appear for trucks with reports
- ✅ No console errors related to images
- ✅ Images load directly from Supabase Storage
