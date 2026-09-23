# Supabase Setup Guide

This application has been migrated from Prisma to Supabase for database management. Follow these steps to set up your Supabase database.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Supabase project created

## Setup Steps

### 1. Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in your project details:
   - Name: Your project name
   - Database Password: Choose a strong password
   - Region: Choose the closest region to your users
4. Wait for the project to be created (takes a few minutes)

### 2. Run Database Migration

1. Go to your Supabase project dashboard
2. Navigate to "SQL Editor" in the left sidebar
3. Open the file `supabase/migrations/001_initial_schema.sql`
4. Copy the entire SQL content
5. Paste it into the SQL Editor
6. Click "Run" to execute the migration

This will create all necessary tables:
- `trucks`
- `contact_submissions`
- `valuation_requests`
- `truck_inquiries`
- `search_queries`
- `truck_submissions`
- `otp_verifications`

### 3. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to "Settings" → "API"
2. You'll find:
   - **Project URL**: Your Supabase project URL
   - **anon/public key**: Your public anon key

### 4. Configure Environment Variables

Create or update your `.env.local` file in the project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Alternatively, you can use:
```env
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
```

### 5. Verify Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. The application should now connect to Supabase instead of a local database.

## Database Schema

The database schema matches the original Prisma schema with the following table mappings:

- `Truck` → `trucks`
- `ContactSubmission` → `contact_submissions`
- `ValuationRequest` → `valuation_requests`
- `TruckInquiry` → `truck_inquiries`
- `SearchQuery` → `search_queries`
- `TruckSubmission` → `truck_submissions`
- `OtpVerification` → `otp_verifications`

## Column Name Mappings

Supabase uses snake_case for column names, while the API uses camelCase. The conversion is handled automatically in the code:

- `imageUrl` → `image_url`
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`
- `truckId` → `truck_id`
- `truckName` → `truck_name`
- `inquiredAt` → `inquired_at`
- `submittedAt` → `submitted_at`
- `requestedAt` → `requested_at`
- `searchedAt` → `searched_at`
- `truckManufacturer` → `truck_manufacturer`
- `truckModel` → `truck_model`
- `additionalInfo` → `additional_info`
- `sellerName` → `seller_name`
- `sellerEmail` → `seller_email`
- `sellerPhone` → `seller_phone`
- `registrationNumber` → `registration_number`
- `fuelType` → `fuel_type`
- `engineCapacity` → `engine_capacity`
- `ownerNumber` → `owner_number`
- `askingPrice` → `asking_price`
- `approvedAt` → `approved_at`
- `maxAttempts` → `max_attempts`
- `expiresAt` → `expires_at`
- `verifiedAt` → `verified_at`

## Row Level Security (RLS)

By default, Supabase enables Row Level Security. You may need to configure RLS policies depending on your security requirements. For now, the application uses the anon key which may require additional RLS configuration.

To disable RLS for development (not recommended for production):

1. Go to "Authentication" → "Policies" in Supabase dashboard
2. For each table, you can create policies or temporarily disable RLS

For production, create appropriate RLS policies based on your access requirements.

## Migration Notes

- All Prisma queries have been replaced with Supabase queries
- The `safeSupabaseQuery` helper function provides the same fallback behavior as `safePrismaQuery`
- Seed data fallbacks are still available if Supabase is not configured
- The application will gracefully handle missing Supabase credentials

## Troubleshooting

### Connection Issues

If you see warnings about Supabase credentials:
- Check that your `.env.local` file exists and has the correct variables
- Restart your development server after adding environment variables
- Verify your Supabase project URL and anon key are correct

### Table Not Found Errors

- Make sure you've run the SQL migration script
- Check the Supabase dashboard to verify tables exist
- Verify table names match exactly (case-sensitive)

### Permission Errors

- Check your RLS policies in Supabase
- Verify you're using the correct anon key
- For development, you may need to adjust RLS policies

## Next Steps

1. Seed your database with initial data if needed
2. Set up proper RLS policies for production
3. Configure backups in Supabase dashboard
4. Set up monitoring and alerts

