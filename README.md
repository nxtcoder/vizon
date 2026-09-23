# Axlerator - Truck Marketplace

A modern Next.js application built with TypeScript for a premier truck marketplace platform.

## Features

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **PostgreSQL** database with Prisma ORM
- **Input Validation** with Zod
- **Rate Limiting** and security headers
- **Responsive Design** with mobile-first approach
- **Smooth Animations** and transitions
- **Video Background** hero section
- **Client-side Navigation** with smooth scrolling

## Sell Truck Intake Form

- Dedicated single-form flow that replaces the multi-step estimator (legacy wizard kept in the codebase but hidden by default)
- Captures brand, model, transmission (manual/automatic/AMT), fuel type, odometer reading, registered state/RTO, ownership count, national permit, insurance, loan status, and selling timeline (immediate / 3 / 6 months / not sure)
- Includes an optional notes field for compliance details plus a rich photo uploader that accepts up to 8 JPG/PNG images with live previews and removal controls
- Form submission is validated client-side before sending, and a success state confirms receipt for sellers

## Prerequisites

- Node.js 18.17 or later
- npm or yarn
- PostgreSQL database (local or cloud)
- EmailJS account (optional, for contact form)

**Development on Windows?** See **[docs/WINDOWS_SETUP.md](./docs/WINDOWS_SETUP.md)** for Git, PATH, env setup with PowerShell, and troubleshooting.

## Getting Started

### 1. Installation

Clone the repository and install dependencies:

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/axlerator?schema=public"

# EmailJS Configuration (optional, for contact form)
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key

# Node Environment
NODE_ENV=development

# Optional: Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000

# Optional: CORS
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### 3. Database Setup

1. Create a PostgreSQL database
2. Update the `DATABASE_URL` in your `.env` file
3. Run Prisma migrations:

```bash
npx prisma migrate dev
```

4. (Optional) Seed the database with sample data:

```bash
npx prisma db seed
```

5. **Supabase truck listing (Buy trucks):** The browse/frontend loads trucks from Supabase. To show trucks like **Eicher 2059 XP** on the website:

   - **Add only Eicher 2059 XP** (no wipe):  
     `npm run seed:eicher-2059xp`
   - **Replace all trucks with the full 30-truck set** (clears existing trucks):  
     `npm run seed:supabase`

   Ensure `.env` or `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `SUPABASE_SERVICE_ROLE_KEY` for inserts).

### 4. Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 5. Build for Production

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── contact/      # Contact form endpoint
│   │   ├── trucks/       # Truck CRUD endpoints
│   │   ├── search/       # Search endpoint
│   │   └── ...
│   ├── browse-trucks/    # Browse trucks page
│   ├── contact/          # Contact page
│   ├── sell-truck/       # Sell truck page
│   ├── truck/            # Truck detail pages
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css        # Global styles
├── components/           # React components
├── lib/
│   ├── prisma.ts         # Prisma client setup
│   ├── validation.ts     # Zod validation schemas
│   ├── api-helpers.ts    # API helper functions
│   └── rate-limit.ts     # Rate limiting
├── middleware.ts         # Next.js middleware (security headers, rate limiting)
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
└── public/               # Static assets
```

## API Endpoints

### Trucks
- `GET /api/trucks` - Get all certified trucks (with pagination)
- `GET /api/trucks/[id]` - Get truck by ID
- `GET /api/trucks/[id]/similar` - Get similar trucks
- `POST /api/trucks` - Create new truck (requires authentication)

### Search
- `GET /api/search?q=query` - Search trucks (with pagination)

### Contact & Inquiries
- `POST /api/contact` - Submit contact form
- `POST /api/inquiries` - Submit truck inquiry
- `POST /api/valuation` - Request truck valuation
- `POST /api/truck-submissions` - Submit truck for sale

All POST endpoints include:
- Input validation with Zod
- Rate limiting (100 requests per minute by default)
- Consistent error handling

## Technologies Used

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **React 18** - UI library
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **Zod** - Schema validation
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Leaflet** - Maps
- **Sonner** - Toast notifications

## Security Features

- ✅ Input validation on all API endpoints
- ✅ Rate limiting (configurable)
- ✅ Security headers (CSP, XSS protection, etc.)
- ✅ CORS configuration
- ✅ SQL injection protection (via Prisma)
- ✅ Foreign key constraints in database

## Database Schema

The application uses the following main models:
- `Truck` - Truck listings
- `ContactSubmission` - Contact form submissions
- `ValuationRequest` - Truck valuation requests
- `TruckInquiry` - Truck inquiries
- `TruckSubmission` - User truck submissions
- `SearchQuery` - Search query logs

## Development Notes

### Adding New API Routes

1. Create validation schema in `lib/validation.ts`
2. Use `validateRequest` helper from `lib/api-helpers.ts`
3. Use `safePrismaQuery` for database operations
4. Return standardized responses using `createSuccessResponse` or `createErrorResponse`

### Rate Limiting

Rate limiting is configured in `middleware.ts`. For production, consider using Redis-based rate limiting for better scalability.

### Database Migrations

After modifying `prisma/schema.prisma`, run:

```bash
npx prisma migrate dev --name your_migration_name
```

## Deployment

### ⚠️ Important: Database Setup for Deployment

**Your local database (`localhost`) will NOT work when deployed!** You need a cloud-hosted PostgreSQL database.

#### Option 1: Supabase (Recommended - Free Tier Available)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **Settings** → **Database**
4. Copy the **Connection String** (URI format)
5. Use this as your `DATABASE_URL` in your deployment platform

#### Option 2: Neon (Serverless PostgreSQL - Free Tier)

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string from the dashboard
4. Use this as your `DATABASE_URL`

#### Option 3: Railway

1. Go to [railway.app](https://railway.app) and sign up
2. Create a new PostgreSQL database
3. Copy the `DATABASE_URL` from the database service
4. Use this in your deployment

#### Option 4: Vercel Postgres

1. In your Vercel project, go to **Storage** → **Create Database**
2. Select **Postgres**
3. The `DATABASE_URL` will be automatically added to your environment variables

### Deployment Steps

#### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. **Add environment variables** in Vercel dashboard:
   - `DATABASE_URL` - Your cloud database connection string
   - `NEXT_PUBLIC_EMAILJS_SERVICE_ID` (if using contact form)
   - `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`
   - `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`
   - `RATE_LIMIT_MAX_REQUESTS=100`
   - `RATE_LIMIT_WINDOW_MS=60000`
   - `ALLOWED_ORIGINS=https://yourdomain.com`
4. **Run database migrations** after first deployment:
   ```bash
   npx prisma migrate deploy
   ```
   Or use Vercel's build command to run migrations automatically
5. Deploy

#### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Railway
- AWS Amplify
- DigitalOcean App Platform
- Render
- Heroku

**For all platforms, make sure to:**
- Set `DATABASE_URL` to your cloud database (NOT localhost)
- Run database migrations: `npx prisma migrate deploy`
- Set all required environment variables
- Configure CORS for your domain

## License

This project is private and proprietary.
