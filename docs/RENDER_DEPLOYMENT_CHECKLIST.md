# 🚀 Render.com Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. ✅ Code Ready
- [x] Build successful (`npm run build` passes)
- [x] All images migrated to Supabase Storage
- [x] Database updated with Supabase URLs
- [x] No local image dependencies

### 2. Environment Variables for Render.com

You need to set these environment variables in your Render.com dashboard:

#### Required Variables:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Value: Your Supabase project URL
   - Example: `https://xxxxxxxxxxxxx.supabase.co`
   - Where to find: Supabase Dashboard → Settings → API → Project URL

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Value: Your Supabase anon/public key
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Where to find: Supabase Dashboard → Settings → API → anon public key

3. **SUPABASE_SERVICE_ROLE_KEY** (for image uploads)
   - Value: Your Supabase service role key
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Where to find: Supabase Dashboard → Settings → API → service_role key
   - ⚠️ **IMPORTANT**: This is a secret key - never expose it in client-side code!

4. **NODE_ENV**
   - Value: `production`
   - Render.com usually sets this automatically

---

## 📋 Step-by-Step Deployment Guide

### Step 1: Set Environment Variables in Render.com

1. Go to your Render.com dashboard
2. Select your web service
3. Go to **"Environment"** tab
4. Click **"Add Environment Variable"**
5. Add each variable one by one:

   ```
   Key: NEXT_PUBLIC_SUPABASE_URL
   Value: [your-supabase-url]
   ```

   ```
   Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: [your-anon-key]
   ```

   ```
   Key: SUPABASE_SERVICE_ROLE_KEY
   Value: [your-service-role-key]
   ```

   ```
   Key: NODE_ENV
   Value: production
   ```

6. Click **"Save Changes"**

### Step 2: Clear Build Cache (IMPORTANT!)

1. In Render.com dashboard, go to your service
2. Click **"Manual Deploy"** → **"Clear build cache & deploy"**
3. This ensures a fresh build with all new changes

### Step 3: Deploy

1. If you haven't already, push your code to GitHub/GitLab
2. Render.com will automatically detect the push and deploy
3. OR manually trigger a deploy from the dashboard

### Step 4: Verify Deployment

After deployment, check:

1. ✅ Website loads without errors
2. ✅ Images display correctly (should load from Supabase)
3. ✅ Sell truck form works
4. ✅ Image upload works (test by uploading a new image)
5. ✅ No console errors in browser

---

## 🔍 How to Get Supabase Keys

### Getting Project URL and Anon Key:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **"Settings"** (⚙️ icon, bottom left)
4. Click **"API"** (under Project Settings)
5. Copy:
   - **Project URL** → Use for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Getting Service Role Key:

1. Same location: Supabase Dashboard → Settings → API
2. Scroll down to **"Project API keys"**
3. Find **"service_role"** key (⚠️ Keep this secret!)
4. Copy → Use for `SUPABASE_SERVICE_ROLE_KEY`

---

## 🐛 Troubleshooting

### Build Fails

**Error: "Cannot find module"**
- Solution: Clear build cache and redeploy

**Error: "Environment variable not found"**
- Solution: Double-check all environment variables are set in Render.com

### Images Not Loading

**Images show broken links**
- Check: Are images uploaded to Supabase Storage?
- Check: Is the bucket public?
- Check: Are image URLs correct in database?

**New uploads fail**
- Check: Is `SUPABASE_SERVICE_ROLE_KEY` set correctly?
- Check: Does the bucket have upload permissions?

### Runtime Errors

**"Supabase client not initialized"**
- Check: Are `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set?
- Check: Are they set as public environment variables (not secrets)?

**Html import errors**
- This should be fixed now, but if it persists:
  - Clear build cache
  - Check that `app/not-found.tsx` and `app/error.tsx` are correct

---

## ✅ Post-Deployment Checklist

After deployment, verify:

- [ ] Homepage loads
- [ ] Browse trucks page works
- [ ] Truck detail pages show images
- [ ] Sell truck form works
- [ ] Image upload works (test with a new image)
- [ ] All images load from Supabase Storage
- [ ] No console errors
- [ ] No build warnings

---

## 📝 Quick Reference

### Render.com Build Settings:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Node Version**: 18.x or 20.x (check your `package.json`)

### Environment Variables Summary:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NODE_ENV=production
```

---

## 🎉 You're Ready to Deploy!

Once you've:
1. ✅ Set all environment variables in Render.com
2. ✅ Cleared the build cache
3. ✅ Pushed your code to GitHub/GitLab

You can deploy! Render.com will automatically build and deploy your application.

**Good luck! 🚀**

