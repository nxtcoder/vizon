# Deployment Errors & Issues Checklist

This document lists common deployment errors and how to fix them.

## 🔴 Critical Errors (Will Break Deployment)

### 1. Missing DATABASE_URL Environment Variable
**Error:** `Error: P1001: Can't reach database server`
**Solution:**
- Set `DATABASE_URL` in your deployment platform's environment variables
- Use a cloud PostgreSQL database (NOT localhost)
- Format: `postgresql://user:password@host:port/database?schema=public`
- **Recommended:** Use Supabase, Neon, Railway, or Vercel Postgres

### 2. Prisma Client Not Generated
**Error:** `@prisma/client did not initialize yet`
**Solution:**
- Add to your build command: `npx prisma generate && npm run build`
- Or add postinstall script in `package.json`: `"postinstall": "prisma generate"`

### 3. Database Migrations Not Run
**Error:** `Table does not exist` or `relation "trucks" does not exist`
**Solution:**
- Run migrations after deployment: `npx prisma migrate deploy`
- Or add to build command: `npx prisma migrate deploy && npm run build`
- **Vercel:** Add to build command: `prisma migrate deploy && next build`

### 4. Missing Required Environment Variables
**Error:** Various runtime errors when features are used
**Required Variables:**
```env
DATABASE_URL=postgresql://...
NODE_ENV=production
```

**Optional but Recommended:**
```env
# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000

# CORS
ALLOWED_ORIGINS=https://yourdomain.com

# EmailJS (for contact form)
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key

# Twilio (for OTP/SMS)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

## ⚠️ Warnings (Won't Break Deployment but Should Fix)

### 1. React Hook Dependency Warnings
**Files Affected:**
- `app/browse-trucks/page.tsx` (line 55)
- `app/truck/[id]/page.tsx` (lines 141, 148, 152)
- `components/BrowseFilters.tsx` (line 46)
- `components/TruckModal.tsx` (line 24)

**Fix:** Add missing dependencies to useEffect dependency arrays or wrap functions in `useCallback`

### 2. Image Optimization Warning
**File:** `app/sell-truck/page.tsx` (line 2154)
**Warning:** Using `<img>` instead of Next.js `<Image />`
**Fix:** Replace `<img>` with `next/image` Image component

### 3. Accessibility Warning
**File:** `components/CustomSelect.tsx` (line 149)
**Warning:** `aria-required` not supported on button role
**Fix:** Remove `aria-required` or change element type

## 🟡 Performance & Best Practices Issues

### 1. In-Memory Rate Limiting (Serverless Incompatible)
**Issue:** `lib/rate-limit.ts` uses in-memory Map which won't work in serverless environments
**Impact:** Rate limiting won't work correctly across multiple serverless instances
**Solution:** 
- Use Redis-based rate limiting (e.g., @upstash/ratelimit)
- Already installed in package.json but not used
- Update `lib/rate-limit.ts` to use Upstash Redis

### 2. Missing Build Optimization
**Issue:** No explicit build output configuration
**Solution:** Consider adding to `next.config.js`:
```js
output: 'standalone', // For Docker deployments
```

### 3. Large Bundle Sizes
**Issue:** Some pages have large First Load JS
- `/sell-truck`: 165 kB
- Middleware: 34.8 kB

**Solution:** 
- Code splitting
- Lazy load heavy components
- Optimize images

## 🔧 Platform-Specific Issues

### Vercel Deployment

**Common Issues:**
1. **Build Command:** Should be `npm run build` (default)
2. **Install Command:** Should be `npm install` (default)
3. **Output Directory:** Leave empty (Next.js handles this)
4. **Node Version:** Set to 18.x or 20.x in Vercel settings

**Required Environment Variables:**
- `DATABASE_URL`
- `NODE_ENV=production`

**Build Command with Prisma:**
```bash
prisma generate && prisma migrate deploy && next build
```

### Railway Deployment

**Common Issues:**
1. **Start Command:** Should be `npm start`
2. **Build Command:** Should be `npm run build`
3. **Database:** Create PostgreSQL service and link it

**Required Environment Variables:**
- `DATABASE_URL` (auto-set if PostgreSQL service is linked)
- `NODE_ENV=production`

### Render Deployment

**Common Issues:**
1. **Build Command:** `npm install && npx prisma generate && npm run build`
2. **Start Command:** `npm start`
3. **Environment:** Node.js 18.x or 20.x

**Required Environment Variables:**
- `DATABASE_URL`
- `NODE_ENV=production`

## 📋 Pre-Deployment Checklist

- [ ] Set `DATABASE_URL` to cloud database (NOT localhost)
- [ ] Run `npx prisma generate` locally to verify it works
- [ ] Run `npx prisma migrate deploy` to verify migrations
- [ ] Test build locally: `npm run build`
- [ ] Set all required environment variables in deployment platform
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS with your production domain
- [ ] (Optional) Set up Twilio for OTP functionality
- [ ] (Optional) Set up EmailJS for contact form
- [ ] Verify build command includes Prisma generation
- [ ] Verify migrations run after deployment

## 🚀 Quick Fix Commands

### Fix Prisma Issues
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Verify database connection
npx prisma db pull
```

### Fix Build Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Build
npm run build

# Test production build
npm start
```

### Fix Environment Variables
```bash
# Check which variables are used
grep -r "process.env" app/ lib/ middleware.ts
```

## 📝 Recommended package.json Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && next build",
    "deploy": "prisma migrate deploy && npm run build"
  }
}
```

## 🔍 Debugging Deployment Errors

1. **Check Build Logs:** Look for Prisma errors, missing env vars
2. **Check Runtime Logs:** Look for database connection errors
3. **Test Locally:** Run `npm run build && npm start` locally
4. **Verify Environment Variables:** Check they're set in deployment platform
5. **Check Database:** Verify database is accessible from deployment platform
6. **Check Node Version:** Ensure it matches locally (18.x or 20.x)

## 📞 Common Error Messages & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `P1001: Can't reach database server` | Missing/invalid DATABASE_URL | Set correct DATABASE_URL |
| `@prisma/client did not initialize` | Prisma not generated | Add `prisma generate` to build |
| `Table does not exist` | Migrations not run | Run `prisma migrate deploy` |
| `Module not found` | Missing dependencies | Run `npm install` |
| `Rate limit exceeded` | Rate limiting not working | Fix rate-limit.ts for serverless |
| `SMS service not configured` | Twilio env vars missing | Set Twilio env vars or disable OTP |

