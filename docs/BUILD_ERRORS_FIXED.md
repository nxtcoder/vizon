# Build Errors - Issues and Solutions

## Issue 1: `<Html>` Import Error

### Problem:
```
Error: <Html> should not be imported outside of pages/_document.
Error occurred prerendering page "/404"
```

### Root Cause:
- Next.js App Router doesn't use `pages/_document.tsx`
- The `not-found.tsx` file was a server component trying to use client components (Navbar, Footer)
- This caused Next.js to try to generate a default error page that uses Html from next/document

### Solution:
✅ Made `app/not-found.tsx` a client component by adding `'use client'` directive
- This allows it to properly use Navbar and Footer which are client components
- Prevents Next.js from trying to use Html from next/document

### Files Changed:
- `app/not-found.tsx` - Added `'use client'` directive

---

## Issue 2: Image Optimization Warning

### Problem:
```
Warning: Using `<img>` could result in slower LCP and higher bandwidth.
Consider using `<Image />` from `next/image`
```

### Root Cause:
- Using standard HTML `<img>` tag instead of Next.js optimized `<Image />` component
- Found in `app/sell-truck/page.tsx` for photo previews

### Solution:
✅ Replaced `<img>` with Next.js `<Image />` component
- Added `import Image from 'next/image'`
- Replaced `<img>` tag with `<Image>` component
- Added required props: `width={200}`, `height={200}`, `unoptimized` (needed for blob URLs from file uploads)

### Files Changed:
- `app/sell-truck/page.tsx` - Replaced img tag with Image component

---

## Summary

### All Issues Fixed:
1. ✅ 404 page prerendering error - Fixed by making not-found.tsx a client component
2. ✅ Image optimization warning - Fixed by using Next.js Image component

### Build Status:
- ✅ No more Html import errors
- ✅ No more image optimization warnings
- ✅ 404 page will prerender correctly
- ✅ All pages should build successfully

### Note About Images:
- Images are NOT uploaded to Supabase
- Images are stored in the `public/trucks/` folder
- Supabase database only stores the image URLs (paths like `/trucks/truck2-image-1.png`)
- The images are served from your Next.js public folder

