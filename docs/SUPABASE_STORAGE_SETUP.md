# 🖼️ Supabase Storage Setup Guide - Step by Step

## 📋 Overview

We'll move all images to Supabase Storage so:
- ✅ No local images in the codebase
- ✅ All images stored in cloud (Supabase)
- ✅ New uploads go directly to Supabase
- ✅ Images load from Supabase URLs

---

## 🎯 STEP 1: Create Supabase Storage Bucket

### What You Need to Do:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Storage**
   - Click **"Storage"** in the left sidebar
   - Click **"New bucket"** button

3. **Create Bucket**
   - **Bucket name**: `truck-images`
   - **Public bucket**: ✅ **Check this** (so images are publicly accessible)
   - Click **"Create bucket"**

4. **Set Bucket Policies** (IMPORTANT!)
   - Click on the `truck-images` bucket
   - Go to **"Policies"** tab
   - Click **"New policy"**
   - Select **"For full customization"**
   - **Policy name**: `Allow public read access`
   - **Allowed operation**: `SELECT` (read)
   - **Policy definition**:
     ```sql
     (bucket_id = 'truck-images')
     ```
   - Click **"Review"** then **"Save policy"**

   - Create another policy for uploads:
   - Click **"New policy"** again
   - **Policy name**: `Allow authenticated uploads`
   - **Allowed operation**: `INSERT` (upload)
   - **Policy definition**:
     ```sql
     (bucket_id = 'truck-images')
     ```
   - Click **"Review"** then **"Save policy"**

---

## 🎯 STEP 2: Get Your Supabase Service Role Key

### What You Need to Do:

1. **Go to Supabase Settings**
   - Click **"Settings"** (gear icon) in left sidebar
   - Click **"API"** in the settings menu

2. **Copy Service Role Key**
   - Find **"service_role"** key (NOT the anon key!)
   - Click **"Reveal"** to show it
   - **Copy this key** - you'll need it for server-side uploads

3. **Add to Environment Variables**
   - Add this to your `.env.local` file:
     ```
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
     ```
   - ⚠️ **IMPORTANT**: This key should NEVER be exposed to the client!
   - It's only used in API routes (server-side)

---

## 🎯 STEP 3: Test the Setup

After completing Steps 1 and 2, tell me:
- ✅ "Bucket created" - I'll verify the setup
- ✅ "Service role key added" - I'll test the connection

Then I'll proceed with updating the code!

---

## 📝 What Happens Next

After you complete Steps 1-2, I will:

1. ✅ Create API endpoint to upload images to Supabase
2. ✅ Update sell-truck page to upload images to Supabase
3. ✅ Create script to upload existing images to Supabase
4. ✅ Update database with new Supabase image URLs
5. ✅ Remove local image dependencies

---

## ⚠️ Important Notes

- **Public Bucket**: We're making the bucket public so images can be accessed without authentication
- **Service Role Key**: This is for server-side uploads only (secure)
- **Image URLs**: Will look like: `https://your-project.supabase.co/storage/v1/object/public/truck-images/filename.jpg`

---

## 🚀 Ready to Start?

1. Complete **STEP 1** (Create bucket)
2. Complete **STEP 2** (Get service role key)
3. Tell me when done, and I'll update the code!

