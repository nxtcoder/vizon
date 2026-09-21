import { NextRequest, NextResponse } from 'next/server'
import { safeSupabaseQuery } from '@/lib/supabase'
import { seedTrucks } from '@/lib/seed-data'
import { resolveTruckListImageUrl } from '@/lib/truck-listing-images'
import { noStoreJsonHeaders } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

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
  // New fields for truck details
  fuel_type?: string | null
  rto?: string | null
  registration_number?: string | null
  insurance_date?: string | null
  transmission?: string | null
  gearbox?: string | null
  ownership_number?: number | null
  tyres?: number | null
  payload_capacity_net?: string | null
  payload_capacity_gross?: string | null
  payload_capacity_ft?: string | null
  legal_report_url?: string | null
  inspection_report_url?: string | null
  // Filled from the inspection form by forms-API `list_draft_as_truck()`
  manufactured_on?: string | null
  emission_norm?: string | null
  engine_capacity?: number | null
  gallery?: string[] | null
  videos?: string[] | null
  web_report_url?: string | null
  quality_scores?: Array<{ group: string; score: number; items: Array<{ name: string; score: number }> }> | null
  inspection_id?: string | null
  createdAt: Date
  updatedAt: Date
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const truckId = parseInt(id)

    if (isNaN(truckId)) {
      return NextResponse.json(
        { error: 'Invalid truck ID' },
        { status: 400, headers: noStoreJsonHeaders }
      )
    }

    let truck = await safeSupabaseQuery<TruckWithNumberPrice | null>(
      async (supabase) => {
        const { data: result, error } = await supabase
          .from('trucks')
          .select('*')
          .eq('id', truckId)
          .single()

        if (error || !result) {
          return null
        }

        // Convert Supabase format to API format
        return {
          id: result.id,
          name: result.name,
          manufacturer: result.manufacturer,
          model: result.model,
          year: result.year,
          kilometers: result.kilometers,
          horsepower: Number(result.horsepower),
          price: Number(result.price),
          imageUrl: resolveTruckListImageUrl(result),
          subtitle: result.subtitle ?? null,
          certified: result.certified,
          state: result.state ?? null,
          location: result.location ?? null,
          city: result.city ?? null,
          // New fields for truck details
          fuel_type: result.fuel_type ?? null,
          rto: result.rto ?? null,
          registration_number: result.registration_number ?? null,
          insurance_date: result.insurance_date ?? null,
          transmission: result.transmission ?? null,
          gearbox: result.gearbox ?? null,
          ownership_number: result.ownership_number ?? null,
          tyres: result.tyres ?? null,
          payload_capacity_net: result.payload_capacity_net ?? null,
          payload_capacity_gross: result.payload_capacity_gross ?? null,
          payload_capacity_ft: result.payload_capacity_ft ?? null,
          legal_report_url: result.legal_report_url ?? null,
          inspection_report_url: result.inspection_report_url ?? null,
          manufactured_on: result.manufactured_on ?? null,
          emission_norm: result.emission_norm ?? null,
          engine_capacity: result.engine_capacity ?? null,
          gallery: result.gallery ?? null,
          videos: result.videos ?? null,
          web_report_url: result.web_report_url ?? null,
          quality_scores: result.quality_scores ?? null,
          inspection_id: result.inspection_id ?? null,
          createdAt: new Date(result.created_at),
          updatedAt: new Date(result.updated_at),
        }
      },
      null
    )

    // When DB has no row (e.g. Tata 1109g LPT from seed list), use seed so detail page works
    if (!truck) {
      const seedTruck = seedTrucks.find(t => t.id === truckId)
      if (seedTruck) {
        truck = {
          id: seedTruck.id,
          name: seedTruck.name,
          manufacturer: seedTruck.manufacturer,
          model: seedTruck.model,
          year: seedTruck.year,
          kilometers: seedTruck.kilometers,
          horsepower: seedTruck.horsepower,
          price: Number(seedTruck.price),
          imageUrl: resolveTruckListImageUrl(seedTruck),
          subtitle: seedTruck.subtitle ?? null,
          certified: seedTruck.certified,
          state: null,
          location: null,
          city: null,
          createdAt: seedTruck.createdAt,
          updatedAt: seedTruck.updatedAt,
        } as TruckWithNumberPrice
      }
    }

    if (!truck) {
      return NextResponse.json(
        { error: 'Truck not found' },
        { status: 404, headers: noStoreJsonHeaders }
      )
    }

    return NextResponse.json(truck, { headers: noStoreJsonHeaders })
  } catch (error) {
    console.error('Error fetching truck:', error)
    return NextResponse.json(
      { error: 'Failed to fetch truck details' },
      { status: 500, headers: noStoreJsonHeaders }
    )
  }
}
