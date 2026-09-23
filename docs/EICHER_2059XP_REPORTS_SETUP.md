# Eicher 2059XP - Reports Upload Setup

## 📋 Overview

This document explains how to upload the PDF reports for the **Eicher 2059XP** truck to Supabase Storage.

## 📁 Files to Upload

1. **Legal Report**: `Copy of Legal Report DL1LAE3215.pdf`
2. **Vehicle Inspection Report**: `VEHICLE INSPECTION REPORT DL1LAE3215.pdf`

Both files are located in: `Eicher 2059XP /`

## 🚀 Upload Script

The upload script has been created: `upload-eicher-2059xp-reports.js`

## ⚙️ Prerequisites

Before running the upload script, make sure you have:

1. **Environment Variables Set Up**
   - Create a `.env.local` file in the project root (if it doesn't exist)
   - Add the following variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     ```

2. **Get Supabase Credentials**
   - Go to your Supabase Dashboard
   - Click "Settings" (gear icon, bottom left)
   - Click "API" (under Project Settings)
   - Copy:
     - **Project URL** → paste after `NEXT_PUBLIC_SUPABASE_URL=`
     - **service_role key** (secret) → paste after `SUPABASE_SERVICE_ROLE_KEY=`

## 📤 How to Upload

1. **Ensure environment variables are set** (see Prerequisites above)

2. **Run the upload script**:
   ```bash
   node upload-eicher-2059xp-reports.js
   ```

3. **The script will**:
   - Upload both PDF reports to Supabase Storage
   - Store them in: `truck-images/EICHER_2059XP/REPORTS/`
   - Update the truck record in the database with report URLs
   - Create a mapping file: `eicher-2059xp-reports-mapping.json`

## 📊 Expected Output

After successful upload, you should see:
- ✅ Both reports uploaded to Supabase
- ✅ Truck record updated with report URLs
- ✅ Mapping file created with all URLs

## 🔍 Database Update

The script will update the truck record (name: "Eicher 2059XP") with:
- `legal_report_url` - URL to the Legal Report PDF
- `inspection_report_url` - URL to the Vehicle Inspection Report PDF

**Note**: If the database columns don't exist, you may need to run:
```sql
ALTER TABLE trucks 
ADD COLUMN IF NOT EXISTS legal_report_url TEXT,
ADD COLUMN IF NOT EXISTS inspection_report_url TEXT;
```

## 📝 Report URLs

After upload, the report URLs will be stored in:
- Database: `trucks` table (columns: `legal_report_url`, `inspection_report_url`)
- Mapping file: `eicher-2059xp-reports-mapping.json`

## ✅ Verification

To verify the upload was successful:
1. Check the console output for success messages
2. Check the mapping file: `eicher-2059xp-reports-mapping.json`
3. Visit the Supabase Storage dashboard and navigate to: `truck-images/EICHER_2059XP/REPORTS/`
4. Check the truck details page - reports should be visible in the Quality Report tab

## 🐛 Troubleshooting

### Error: "Supabase credentials not found"
- Make sure `.env.local` exists in the project root
- Verify the environment variable names are correct
- Restart your terminal after creating/modifying `.env.local`

### Error: "Source folder not found"
- Make sure the folder `Eicher 2059XP ` (with space at the end) exists in the project root
- Verify the PDF files are in that folder

### Error: "Error finding truck"
- The truck "Eicher 2059XP" may not exist in the database yet
- Reports will still be uploaded, but database update will be skipped
- You can manually update the truck record later using the URLs from the mapping file

### Error: "Error updating truck"
- The database columns may not exist
- Run the SQL command above to add the columns
- Or manually update the truck record using the URLs from the mapping file

## 📞 Next Steps

After successful upload:
1. ✅ Reports are uploaded to Supabase Storage
2. ✅ Truck record is updated with report URLs
3. ✅ Reports should be visible on the truck details page (Quality Report tab)

If the reports don't appear on the truck details page, you may need to:
- Check that the truck details page component supports displaying reports
- Verify the truck name matches exactly: "Eicher 2059XP"
