# Upload ASHOK LEYLAND ECOMET STAR 1415 HE Truck to Supabase

This guide will help you upload the ASHOK LEYLAND ECOMET STAR 1415 HE truck details to your Supabase database so it appears in the "Buy Trucks" page.

## Method 1: Using the API Endpoint (Recommended)

1. Make sure your Next.js development server is running:
   ```bash
   npm run dev
   ```

2. Open your browser or use curl to call the API endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/upload-ashok-leyland
   ```

   Or visit this URL in your browser (though POST requests work better with curl or Postman):
   ```
   http://localhost:3000/api/upload-ashok-leyland
   ```

3. The truck will be uploaded to your Supabase database and should appear in the "Buy Trucks" page.

## Method 2: Using the Node.js Script

1. Make sure you have a `.env.local` file in your project root with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

2. Run the upload script:
   ```bash
   node upload-ashok-leyland-truck.js
   ```

## Truck Details

The following details will be uploaded:

- **Name**: ASHOK LEYLAND ECOMET STAR 1415 HE
- **Manufacturer**: Ashok Leyland
- **Model**: Ecomet Star 1415 HE
- **Year**: 2020 (default - update if you have the actual year)
- **Kilometers**: 50,000 (default - update if you have actual kilometers)
- **Horsepower**: 141 HP
- **Price**: ₹15,00,000 (default - update with actual price)
- **Location**: Uttar Pradesh
- **City**: Lucknow (default - update if you know the actual city)
- **Registration**: UP14LT8731 (from PDF file names)
- **Certified**: Yes

## Next Steps After Upload

1. **Upload Images**: 
   - Copy one of the truck images from the folder to `public/trucks/ashok-leyland-ecomet-star-1415-he.jpg`
   - Or upload images to Supabase Storage and update the `image_url` in the database

2. **Update Truck Details** (if needed):
   - Year, kilometers, and price can be updated directly in Supabase dashboard
   - Or modify the script/API endpoint and re-run

3. **Verify**:
   - Visit the "Buy Trucks" page
   - The truck should appear in the list

## Files Created

- `app/api/upload-ashok-leyland/route.ts` - API endpoint to upload the truck
- `upload-ashok-leyland-truck.js` - Node.js script to upload the truck
- This README file

## Troubleshooting

- **"Supabase credentials not found"**: Make sure your `.env.local` file exists and has the correct Supabase credentials
- **"Truck already exists"**: The truck is already in the database. You can update it directly in Supabase or delete it first
- **Images not showing**: Make sure the image path is correct and the image file exists in the `public/trucks/` folder
