import { NextResponse } from 'next/server'
import { safeSupabaseQuery, Truck } from '@/lib/supabase'
import { searchQuerySchema, paginationSchema } from '@/lib/validation'
import { validateRequest, formatValidationError, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { resolveTruckListImageUrl } from '@/lib/truck-listing-images'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query) {
      return NextResponse.json({ trucks: [], total: 0, page: 1, limit: 20, totalPages: 0 })
    }
    
    // Validate search query
    const queryValidation = validateRequest(searchQuerySchema, { q: query })
    if (!queryValidation.success) {
      return createErrorResponse(
        'Invalid search query',
        400,
        formatValidationError(queryValidation.error)
      )
    }

    // Validate pagination
    const pagination = validateRequest(paginationSchema, {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    })
    
    const page = pagination.success ? pagination.data.page : 1
    const limit = pagination.success ? pagination.data.limit : 20
    const skip = (page - 1) * limit
    
    const result = await safeSupabaseQuery(
      async (supabase) => {
        // Log search query (non-blocking)
        ;(async () => {
          try {
            await supabase.from('search_queries').insert({ query: queryValidation.data.q })
          } catch {
            // Silently fail if logging fails
          }
        })()
        
        const searchQuery = `%${queryValidation.data.q}%`
        
        // Search trucks using Supabase text search
        const { data: trucks, error, count } = await supabase
          .from('trucks')
          .select('*', { count: 'exact' })
          .eq('certified', true)
          .eq('sold', false)
          .or(`name.ilike.${searchQuery},manufacturer.ilike.${searchQuery},model.ilike.${searchQuery}`)
          .order('created_at', { ascending: false })
          .range(skip, skip + limit - 1)

        if (error) {
          throw error
        }
        
        // Convert Supabase format to API format
        const trucksWithNumberPrice = (trucks || []).map((truck: Truck) => ({
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
        
        const total = count || 0
        return { trucks: trucksWithNumberPrice, total, page, limit, totalPages: Math.ceil(total / limit) }
      },
      { trucks: [], total: 0, page: 1, limit: 20, totalPages: 0 }
    )
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error searching trucks:', error)
    return createErrorResponse(
      'An unexpected error occurred. Please try again later.',
      500
    )
  }
}
