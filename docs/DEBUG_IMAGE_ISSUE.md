# 🔍 Debug Guide: Why Fallback Images Are Showing

## Problem
You're seeing fallback/hardcoded images instead of actual images from Supabase Storage.

## Root Cause
The API is likely returning empty arrays `[]`, so `fetchedImages` stays empty, and `getGalleryImages()` falls back to hardcoded images.

## How to Debug

### Step 1: Check Browser Console
1. Open your deployed website
2. Open Browser DevTools (F12)
3. Go to Console tab
4. Navigate to a truck detail page
5. Look for these logs:
   - `[Truck Details] Fetching images for truck: "..."`
   - `[Truck Details] API response: {...}`
   - `[Truck Details] Setting X images` OR `[Truck Details] ❌ No images in API response`

### Step 2: Test API Directly
Visit this URL in your browser (replace with your domain and truck name):
```
https://your-domain.com/api/truck-images?truckName=Tata%20609g
```

**Expected Response:**
```json
{
  "images": [
    "https://ccmlkidiwxmqxzexoeji.supabase.co/storage/v1/object/public/truck-images/TATA_609G/...",
    ...
  ],
  "count": 10,
  "folder": "TATA_609G",
  "source": "supabase-storage"
}
```

**If you see empty array:**
```json
{
  "images": [],
  "error": "..."
}
```

### Step 3: Check Vercel Function Logs
1. Go to Vercel Dashboard
2. Your Project → Deployments → Latest Deployment
3. Click "Function Logs"
4. Look for logs starting with `[API]`
5. Check for:
   - `[API] Available folders: ...` - Should list all folders in Supabase
   - `[API] Using folder: ...` - Should show which folder is being used
   - `[API] Found X files in folder` - Should show files found
   - `[API] ✅ Generated X image URLs` - Should show URLs generated

### Step 4: Verify Supabase Storage
1. Go to Supabase Dashboard → Storage
2. Check if `truck-images` bucket exists
3. Check if folders exist (e.g., `TATA_609G`, `TATA_709G_LPT`, etc.)
4. Verify folders contain image files
5. Make sure bucket is **Public**

## Common Issues & Fixes

### Issue 1: API Returns Empty Array
**Symptoms:** `"images": []` in API response

**Possible Causes:**
- Folder name doesn't match truck name
- Files in folder aren't image files
- Bucket permissions issue

**Fix:**
- Check Vercel logs to see which folder is being used
- Verify folder name in Supabase matches what API expects
- Check file extensions in Supabase Storage

### Issue 2: API Returns Error
**Symptoms:** `"error": "..."` in API response

**Possible Causes:**
- Environment variables not set in Vercel
- Supabase bucket not accessible
- Folder doesn't exist

**Fix:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Vercel → Production
- Test at `/api/test-supabase` to verify connection
- Check bucket exists and is public

### Issue 3: Frontend Not Using Fetched Images
**Symptoms:** API returns images but frontend shows fallback

**Possible Causes:**
- `fetchedImages` state not updating
- Timing issue (images load after component renders)
- `getGalleryImages()` logic issue

**Fix:**
- Check browser console for `[getGalleryImages]` logs
- Verify `fetchedImages.length > 0` is true
- Check if hardcoded images are being returned instead

## Quick Test

Run this in browser console on your deployed site:
```javascript
// Test API
fetch('/api/truck-images?truckName=Tata%20609g')
  .then(r => r.json())
  .then(data => {
    console.log('API Response:', data)
    console.log('Images count:', data.images?.length || 0)
    console.log('First image:', data.images?.[0])
  })
```

## What the Logs Should Show

### Successful Flow:
```
[API] truck-images route called
[API] Supabase client initialized successfully
[API] Fetching images for truck: "Tata 609g"
[API] Listing all available folders in bucket...
[API] Available folders (10): TATA_609G, TATA_709G_LPT, ...
[API] Using folder: TATA_609G
[API] Found 15 files in folder: TATA_609G
[API] ✅ Generated 15 image URLs from Supabase Storage
[Truck Details] ✅ Setting 15 images from API
[getGalleryImages] Using 15 fetched images from API
```

### Failed Flow:
```
[API] Available folders (10): ...
[API] Could not find folder for truck: "Tata 609g"
[API] Available folders: TATA_609G, ...
[Truck Details] ❌ No images in API response
[getGalleryImages] No fetched images, using fallback
```

## Next Steps

After checking the logs:
1. **If API returns empty:** Check folder names in Supabase match truck names
2. **If API returns error:** Check environment variables and bucket permissions
3. **If API works but frontend doesn't use it:** Check `getGalleryImages()` logic

The detailed logging I added will help identify exactly where the issue is!
