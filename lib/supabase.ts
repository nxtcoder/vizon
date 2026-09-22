import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase credentials not found. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.')
}

// Create Supabase client
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Helper function to safely execute Supabase queries
export async function safeSupabaseQuery<T>(
  queryFn: (supabase: SupabaseClient) => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized. Using fallback data.')
      return fallback
    }
    return await queryFn(supabase)
  } catch (error) {
    console.error('Supabase query error:', error)
    return fallback
  }
}

// Type definitions for database tables
export interface Truck {
  id: number
  name: string
  manufacturer: string
  model: string
  year: number
  kilometers: number
  horsepower: number
  price: number
  image_url: string
  subtitle: string | null
  certified: boolean
  state: string | null
  location: string | null
  city: string | null
  rto?: string | null
  fuel_type?: string | null
  transmission?: string | null
  registration_number?: string | null
  ownership_number?: number | null
  created_at: string
  updated_at: string
}

export interface ContactSubmission {
  id: number
  name: string
  email: string
  phone: string | null
  message: string
  submitted_at: string
}

export interface ValuationRequest {
  id: number
  name: string
  email: string
  phone: string
  truck_manufacturer: string
  truck_model: string
  year: number
  kilometers: number
  condition: string
  additional_info: string | null
  requested_at: string
}

export interface TruckInquiry {
  id: number
  truck_id: number
  truck_name: string
  name: string
  email: string
  phone: string
  message: string | null
  inquired_at: string
}

export interface SearchQuery {
  id: number
  query: string
  searched_at: string
}

export interface TruckSubmission {
  id: number
  seller_name: string
  seller_email: string
  seller_phone: string
  manufacturer: string
  model: string
  year: number
  registration_number: string | null
  kilometers: number
  fuel_type: string
  transmission: string
  horsepower: number | null
  engine_capacity: string | null
  condition: string
  owner_number: number
  asking_price: number
  negotiable: boolean
  location: string
  state: string
  city: string
  features: string | null
  description: string | null
  images: string
  status: string
  certified: boolean
  submitted_at: string
  approved_at: string | null
}

export interface OtpVerification {
  id: number
  phone: string
  otp: string
  purpose: string
  verified: boolean
  attempts: number
  max_attempts: number
  expires_at: string
  created_at: string
  verified_at: string | null
}

