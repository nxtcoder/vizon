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
  rto: string | null
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

    // First, get the current truck to find similar ones
    const currentTruck = await safeSupabaseQuery<TruckWithNumberPrice | null>(
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
          horsepower: result.horsepower,
          price: Number(result.price),
          imageUrl: resolveTruckListImageUrl(result),
          subtitle: result.subtitle ?? null,
          certified: result.certified,
          state: result.state ?? null,
          location: result.location ?? null,
          city: result.city ?? null,
          rto: result.rto ?? null,
          createdAt: new Date(result.created_at),
          updatedAt: new Date(result.updated_at),
        }
      },
      // Fallback to seed data
      (() => {
        const seedTruck = seedTrucks.find(t => t.id === truckId)
        if (!seedTruck) return null
        return {
          ...seedTruck,
          imageUrl: resolveTruckListImageUrl(seedTruck),
          subtitle: seedTruck.subtitle ?? null,
          state: null,
          location: null,
          city: null,
          rto: null,
        } as TruckWithNumberPrice
      })()
    )

    if (!currentTruck) {
      return NextResponse.json(
        { error: 'Truck not found' },
        { status: 404, headers: noStoreJsonHeaders }
      )
    }

    // Find similar trucks based on manufacturer or price range
    const priceMin = Number(currentTruck.price) * 0.7
    const priceMax = Number(currentTruck.price) * 1.3

    const similarTrucks = await safeSupabaseQuery<TruckWithNumberPrice[]>(
      async (supabase) => {
        // Get trucks by manufacturer first
        const { data: byManufacturer, error: error1 } = await supabase
          .from('trucks')
          .select('*')
          .eq('manufacturer', currentTruck.manufacturer)
          .neq('id', truckId)
          .eq('certified', true)
          .eq('sold', false)
          .limit(4)

        // Get trucks by price range
        const { data: byPrice, error: error2 } = await supabase
          .from('trucks')
          .select('*')
          .neq('id', truckId)
          .eq('certified', true)
          .eq('sold', false)
          .gte('price', priceMin)
          .lte('price', priceMax)
          .limit(4)

        if (error1 || error2) {
          throw error1 || error2
        }

        // Combine and deduplicate results
        const allResults = [...(byManufacturer || []), ...(byPrice || [])]
        const uniqueResults = Array.from(
          new Map(allResults.map(truck => [truck.id, truck])).values()
        ).slice(0, 4)

        // Convert Supabase format to API format
        return uniqueResults.map(truck => ({
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
          createdAt: new Date(truck.created_at),
          updatedAt: new Date(truck.updated_at),
        }))
      },
      // Fallback to seed data - find similar trucks
      (() => {
        return seedTrucks
          .filter(t => t.id !== truckId)
          .filter(t => 
            t.manufacturer === currentTruck.manufacturer ||
            (Number(t.price) >= priceMin && Number(t.price) <= priceMax)
          )
          .slice(0, 4)
          .map(truck => ({
            ...truck,
            imageUrl: resolveTruckListImageUrl(truck),
            subtitle: truck.subtitle ?? null,
            state: null,
            location: null,
            city: null,
            rto: null,
          })) as TruckWithNumberPrice[]
      })()
    )

    return NextResponse.json(similarTrucks, { headers: noStoreJsonHeaders })
  } catch (error) {
    console.error('Error fetching similar trucks:', error)
    // Return empty array instead of error object to prevent .map() errors
    return NextResponse.json([], { status: 200, headers: noStoreJsonHeaders })
  }
}

