# 🖼️ Complete Image Migration Guide - Step by Step

## 📋 Overview

This guide will help you:
1. ✅ Set up Supabase Storage bucket
2. ✅ Upload existing images to Supabase
3. ✅ Update code to use Supabase Storage
4. ✅ Fix the Html import error (separate issue)

---

## 🎯 STEP 1: Create Supabase Storage Bucket (YOU DO THIS)

### 1.1 Go to Supabase Dashboard
- Visit: https://supabase.com/dashboard
- Select your project

### 1.2 Create Storage Bucket
1. Click **"Storage"** in left sidebar
2. Click **"New bucket"** button
3. **Bucket name**: `truck-images`
4. **Public bucket**: ✅ **Check this** (important!)
5. Click **"Create bucket"**

### 1.3 Set Bucket Policies
1. Click on `truck-images` bucket
2. Go to **"Policies"** tab
3. Click **"New policy"** → **"For full customization"**
4. **Policy 1 - Public Read**:
   - Name: `Allow public read access`
   - Operation: `SELECT`
   - Policy: `(bucket_id = 'truck-images')`
5. **Policy 2 - Authenticated Upload**:
   - Name: `Allow authenticated uploads`
   - Operation: `INSERT`
   - Policy: `(bucket_id = 'truck-images')`

**✅ Tell me when Step 1 is done!**

---

## 🎯 STEP 2: Get Service Role Key (YOU DO THIS)

### 2.1 Get the Key
1. Go to **Settings** → **API**
2. Find **"service_role"** key (NOT anon key!)
3. Click **"Reveal"** to show it
4. **Copy this key**

### 2.2 Add to Environment Variables
Add this line to your `.env.local` file:
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**⚠️ IMPORTANT**: This key should NEVER be exposed to the client! It's only used in API routes.

**✅ Tell me when Step 2 is done!**

---

## 🎯 STEP 3: I'll Update the Code (I DO THIS)

After you complete Steps 1-2, I will:
1. ✅ Create API endpoint for image uploads (`/api/upload-image`)
2. ✅ Update sell-truck page to upload images to Supabase
3. ✅ Create script to upload existing images to Supabase
4. ✅ Update database with new Supabase URLs
5. ✅ Fix Html import error

---

## 🎯 STEP 4: Upload Existing Images (WE DO THIS TOGETHER)

After code is updated, we'll:
1. Run script to upload all existing images from `public/trucks/` to Supabase
2. Update database records with new Supabase URLs
3. Test that images load correctly

---

## 📝 What's Already Done

✅ Created `/api/upload-image/route.ts` - API endpoint for uploads
✅ Created setup guide (`SUPABASE_STORAGE_SETUP.md`)

---

## 🚀 Ready to Start?

1. **Complete STEP 1** (Create bucket) - 5 minutes
2. **Complete STEP 2** (Get service role key) - 2 minutes
3. **Tell me when done** - I'll update the code!

---

## ⚠️ Important Notes

- **Public Bucket**: Images will be publicly accessible (needed for website)
- **Service Role Key**: Only used server-side (secure)
- **Image URLs**: Will be like: `https://your-project.supabase.co/storage/v1/object/public/truck-images/filename.jpg`
- **Html Error**: This is separate from images - we'll fix it too!

---

## ❓ Questions?

If you get stuck on any step, just ask! I'm here to help. 😊

