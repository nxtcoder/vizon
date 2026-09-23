# 🚀 Deployment Image Fix Guide

## Problem
Images work locally but not after deployment. This is usually due to:
1. Missing environment variables in the deployment platform
2. File system access limitations in serverless environments
3. Incorrect Supabase configuration

## ✅ Solution Applied

The code has been updated to:
- ✅ Fetch mapping files from public URLs (works in production)
- ✅ Always fall back to Supabase Storage if mapping files fail
- ✅ Better error handling and logging
- ✅ Runtime environment variable validation

## 📋 Required Environment Variables

You **MUST** set these in your deployment platform (Vercel, Render, etc.):

### 1. NEXT_PUBLIC_SUPABASE_URL
- **Value**: Your Supabase project URL
- **Example**: `https://xxxxxxxxxxxxx.supabase.co`
- **Where to find**: Supabase Dashboard → Settings → API → Project URL

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Value**: Your Supabase anon/public key
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find**: Supabase Dashboard → Settings → API → anon public key

## 🔧 Setting Up Environment Variables

### For Vercel:

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Select your project
3. Click on **Settings** → **Environment Variables**
4. **IMPORTANT**: Check if variables already exist:
   - If they exist, make sure they're set for **Production** environment
   - If they're only set for Preview/Development, add them for Production too
5. Add/Update each variable:
   - **Key**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: `https://ccmlkidiwxmqxzexoeji.supabase.co` (your actual URL)
   - **Environment**: **Select "Production"** (this is critical!)
   - Also select Preview and Development if you want
6. Click **Save**
7. Repeat for `NEXT_PUBLIC_SUPABASE_ANON_KEY`:
   - **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your actual key)
   - **Environment**: **Select "Production"**
8. **CRITICAL**: After adding/updating variables, you MUST redeploy:
   - Go to **Deployments** tab
   - Click the **⋯** (three dots) on the latest deployment
   - Click **Redeploy**
   - OR trigger a new deployment by pushing to your main branch

### ⚠️ Common Vercel Issue:

**Problem**: Variables are set but images still don't work

**Solution**: 
1. Variables must be set for **Production** environment (not just Preview)
2. You MUST redeploy after adding/updating environment variables
3. `NEXT_PUBLIC_*` variables are embedded at build time, so a new build is required

### 🧪 Test Your Configuration:

After deploying, test your Supabase configuration:
- Visit: `https://your-domain.com/api/test-supabase`
- This will show you if Supabase is configured correctly
- Check the response to see if variables are being read

### For Render.com:

1. Go to your Render dashboard
2. Select your web service
3. Go to **Environment** tab
4. Click **Add Environment Variable**
5. Add:
   - **Key**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: `https://your-project-id.supabase.co`
6. Click **Save Changes**
7. Repeat for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
8. **Manual Deploy** → **Clear build cache & deploy**

### For Other Platforms:

Follow the same pattern:
1. Find **Environment Variables** or **Config** section
2. Add both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Redeploy your application

## 🧪 Testing After Deployment

1. **Check the API endpoint**:
   - Visit: `https://your-domain.com/api/truck-images?truckName=Tata%20609g`
   - You should see a JSON response with images array

2. **Check browser console**:
   - Open browser DevTools → Console
   - Look for any errors related to Supabase

3. **Check deployment logs**:
   - Look for error messages about missing environment variables
   - The API now logs helpful error messages if Supabase is not configured

## 🔍 Troubleshooting

### Images still not showing?

1. **Verify environment variables are set**:
   - Check your deployment platform's environment variables section
   - Make sure they're set for the correct environment (Production/Preview)

2. **Check Supabase Storage bucket permissions**:
   - Go to Supabase Dashboard → Storage
   - Select `truck-images` bucket
   - Make sure it's set to **Public** (or has proper RLS policies)

3. **Verify folder names match**:
   - Check that folder names in Supabase Storage match the truck names
   - Example: `TATA_609G` folder should exist for "Tata 609g" trucks

4. **Check deployment logs**:
   - Look for API errors in your deployment platform's logs
   - The API now provides detailed error messages

### Common Errors:

**Error: "Supabase not configured"**
- → Environment variables are missing
- → Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Error: "Failed to fetch images"**
- → Check Supabase Storage bucket permissions
- → Verify folder names match truck names
- → Check that images exist in the folder

**Error: "No files found in folder"**
- → The folder name might not match
- → Check the folder name in Supabase Storage
- → The API will try to construct folder names automatically

## 📝 Notes

- The API now prioritizes fetching from Supabase Storage (works in production)
- Mapping files are optional - if they fail, the API falls back to Supabase
- All errors are logged with helpful messages for debugging
- Environment variables must be set in your deployment platform (not just locally)

## ✅ After Setting Up

1. **Redeploy** your application
2. **Test** by visiting a truck detail page
3. **Check** that images load correctly
4. **Monitor** deployment logs for any errors

If you still have issues, check the deployment logs for specific error messages - the API now provides detailed error information to help debug the issue.
