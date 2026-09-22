import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { safeSupabaseQuery, type Truck } from '@/lib/supabase'
import { truckCreateSchema, trucksListPaginationSchema } from '@/lib/validation'
import {
  validateRequest,
  formatValidationError,
  createErrorResponse,
  createSuccessResponse,
  noStoreJsonHeaders,
} from '@/lib/api-helpers'
import { seedTrucks } from '@/lib/seed-data'
import { resolveTruckListImageUrl } from '@/lib/truck-listing-images'

export const dynamic = 'force-dynamic'

/** RTO code from the plate, zero-padded the way rto_offices keys it: "DL1LAE3215" -> "DL01". */
const rtoCodeFromPlate = (plate?: string | null) => {
  const m = (plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '').match(/^([A-Z]{2})(\d{1,2})/)
  return m ? `${m[1]}${m[2].padStart(2, '0')}` : null
}

/**
 * State each plate was registered in, from rto_offices. That table has no
 * public read policy, so it is read with the service-role key (server only).
 */
async function statesForPlates(plates: (string | null | undefined)[]) {
  const codes = [...new Set(plates.map(rtoCodeFromPlate).filter((c): c is string => !!c))]
  const byCode = new Map<string, string>()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (codes.length && url && key) {
    const { data, error } = await createClient(url, key)
      .from('rto_offices')
      .select('code, state_name')
      .in('code', codes)
    if (error) console.error('Error reading rto_offices:', error)
    for (const row of data || []) byCode.set(row.code, row.state_name)
  }
  return (plate?: string | null) => byCode.get(rtoCodeFromPlate(plate) || '') ?? null
}

type TruckWithNumberPrice = {
  id: number
  name: string
  manufacturer: string
  model: string
  year: number
  kilometers: number
  horsepower: number
  price: number
  imageUrl: string
  subtitle: string | null
  certified: boolean
  state: string | null
  location: string | null
  city: string | null
  rto: string | null
  fuel_type: string | null
  transmission: string | null
  rto_state: string | null
  ownership_number: number | null
  createdAt: Date
  updatedAt: Date
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validate pagination
    const pagination = validateRequest(trucksListPaginationSchema, {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    })
    
    const page = pagination.success ? pagination.data.page : 1
    const limit = pagination.success ? pagination.data.limit : 20
    const skip = (page - 1) * limit

    const result = await safeSupabaseQuery<{
      trucks: TruckWithNumberPrice[]
      total: number
      page: number
      limit: number
      totalPages: number
    }>(
      async (supabase) => {
        // Get total count
        const { count } = await supabase
          .from('trucks')
          .select('*', { count: 'exact', head: true })
          .eq('certified', true)
          .eq('sold', false)

        // Get paginated trucks
        const { data: trucks, error } = await supabase
          .from('trucks')
          .select('*')
          .eq('certified', true)
          .eq('sold', false)
          .order('created_at', { ascending: false })
          .range(skip, skip + limit - 1)

        if (error) {
          throw error
        }

        const stateOf = await statesForPlates((trucks || []).map((t: Truck) => t.registration_number))

        // Convert Supabase format to API format (only certified rows, DB order — no injected/seed rows)
        const trucksWithNumberPrice: TruckWithNumberPrice[] = (trucks || []).map((truck: Truck) => ({
          id: truck.id,
          name: truck.name,
          manufacturer: truck.manufacturer,
          model: truck.model,
          year: truck.year,
          kilometers: truck.kilometers,
          horsepower: truck.horsepower,
          price: Number(truck.price),
          imageUrl: resolveTruckListImageUrl(truck),
          subtitle: truck.subtitle ?? null,
          certified: truck.certified,
          state: truck.state ?? null,
          location: truck.location ?? null,
          city: truck.city ?? null,
          rto: truck.rto ?? null,
          fuel_type: truck.fuel_type ?? null,
          transmission: truck.transmission ?? null,
          rto_state: stateOf(truck.registration_number),
          ownership_number: truck.ownership_number ?? null,
          createdAt: new Date(truck.created_at),
          updatedAt: new Date(truck.updated_at),
        }))

        const total = count || 0
        return {
          trucks: trucksWithNumberPrice,
          total,
          page,
          limit,
          totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
        }
      },
      // Fallback to seed data when database is unavailable
      (() => {
        const certifiedTrucks = seedTrucks.filter(t => t.certified)
        const paginatedTrucks = certifiedTrucks.slice(skip, skip + limit).map(truck => ({
          ...truck,
          imageUrl: resolveTruckListImageUrl(truck),
          subtitle: truck.subtitle ?? null,
          state: null,
          location: null,
          city: null,
          rto: null,
          fuel_type: null,
          transmission: null,
          rto_state: null,
          ownership_number: null,
        })) as TruckWithNumberPrice[]
        return {
          trucks: paginatedTrucks,
          total: certifiedTrucks.length,
          page,
          limit,
          totalPages: Math.ceil(certifiedTrucks.length / limit)
        }
      })()
    )
    
    return NextResponse.json(result, { headers: noStoreJsonHeaders })
  } catch (error) {
    console.error('Error fetching trucks:', error)
    return createErrorResponse(
      'An unexpected error occurred. Please try again later.',
      500
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = validateRequest(truckCreateSchema, body)
    if (!validation.success) {
      return createErrorResponse(
        'Invalid input data',
        400,
        formatValidationError(validation.error)
      )
    }

    // TODO: Add authentication check here
    // For now, we'll allow it but in production, add proper auth

    const truck = await safeSupabaseQuery<TruckWithNumberPrice | null>(
      async (supabase) => {
        // Convert API format to Supabase format
        const truckData = {
          name: validation.data.name,
          manufacturer: validation.data.manufacturer,
          model: validation.data.model,
          year: validation.data.year,
          kilometers: validation.data.kilometers,
          horsepower: validation.data.horsepower,
          price: validation.data.price,
          image_url: validation.data.imageUrl,
          subtitle: validation.data.subtitle ?? null,
          certified: validation.data.certified ?? true,
          state: null,
          location: null,
          city: null,
        }

        const { data: result, error } = await supabase
          .from('trucks')
          .insert(truckData)
          .select()
          .single()

        if (error) {
          throw error
        }

        if (!result) {
          return null
        }

        const stateOf = await statesForPlates([result.registration_number])

        // Convert Supabase format to API format
        return {
          id: result.id,
          name: result.name,
          manufacturer: result.manufacturer,
          model: result.model,
          year: result.year,
          kilometers: result.kilometers,
          horsepower: result.horsepower,
          price: Number(result.price),
          imageUrl: result.image_url,
          subtitle: result.subtitle ?? null,
          certified: result.certified,
          state: result.state ?? null,
          location: result.location ?? null,
          city: result.city ?? null,
          rto: result.rto ?? null,
          fuel_type: result.fuel_type ?? null,
          transmission: result.transmission ?? null,
          rto_state: stateOf(result.registration_number),
          ownership_number: result.ownership_number ?? null,
          createdAt: new Date(result.created_at),
          updatedAt: new Date(result.updated_at),
        }
      },
      null
    )
    
    if (!truck) {
      return createErrorResponse(
        'Failed to create truck. Please try again later.',
        503
      )
    }
    
    return createSuccessResponse(
      truck,
      'Truck created successfully',
      201
    )
  } catch (error) {
    console.error('Error creating truck:', error)
    return createErrorResponse(
      'An unexpected error occurred. Please try again later.',
      500
    )
  }
}
