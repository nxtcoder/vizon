'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import TruckCard from '@/components/TruckCard'
import BrowseFilters from '@/components/BrowseFilters'
import Footer from '@/components/Footer'
import { resolveTruckListImageUrl } from '@/lib/truck-listing-images'
import { formatTruckListingLocation } from '@/lib/utils'

interface Truck {
  id: number
  name: string
  year: number
  price: string
  mileage: string
  engine: string
  transmission: string
  location: string
  image: string
  certified: boolean
  features?: string[]
  owner?: string
  brand?: string
  ownerNumber?: number
  rtoState?: string | null
}

// One name per brand, however the row spells it ("Tata", "TATA Motors", "Tata Motors").
const BRAND_NAMES: Array<[RegExp, string]> = [
  [/^tata/i, 'Tata Motors'],
  [/^ashok/i, 'Ashok Leyland'],
  [/^mahindra/i, 'Mahindra'],
  [/^eicher/i, 'Eicher Motors'],
  [/^sml/i, 'SML Isuzu'],
  [/^bajaj/i, 'Bajaj'],
  [/^bharat\s*benz/i, 'BharatBenz'],
  [/^force/i, 'Force Motors'],
  [/^volvo/i, 'Volvo'],
  [/^maruti/i, 'Maruti Suzuki'],
  [/^toyota/i, 'Toyota'],
]
const brandName = (manufacturer?: string | null) => {
  const m = (manufacturer || '').trim()
  if (!m) return undefined
  return BRAND_NAMES.find(([re]) => re.test(m))?.[1] || m
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest listed' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'year-desc', label: 'Year: Newest first' },
  { value: 'year-asc', label: 'Year: Oldest first' },
] as const
type SortBy = (typeof SORT_OPTIONS)[number]['value']

const priceValue = (price: string) => parseInt(price.replace(/[^0-9]/g, '')) || 0

/** "newest" keeps the API's order, newest listing first. */
const sortTrucks = <T extends { price: string; year: number }>(list: T[], sortBy: SortBy) => {
  if (sortBy === 'newest') return list
  const sorted = [...list]
  if (sortBy === 'price-asc') sorted.sort((a, b) => priceValue(a.price) - priceValue(b.price))
  if (sortBy === 'price-desc') sorted.sort((a, b) => priceValue(b.price) - priceValue(a.price))
  if (sortBy === 'year-desc') sorted.sort((a, b) => b.year - a.year)
  if (sortBy === 'year-asc') sorted.sort((a, b) => a.year - b.year)
  return sorted
}

const ordinalOwner = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'} Owner`

const DEFAULT_FILTERS = {
  priceMin: 50000,
  priceMax: 7000000,
  selectedBrands: [] as string[],
  selectedYears: [] as string[],
  selectedKmRanges: [] as string[],
  selectedFuelTypes: [] as string[],
  selectedOwners: [] as string[],
  transmission: '',
  location: '',
  selectedStates: [] as string[],
  searchQuery: ''
}

function BrowseTrucksContent() {
  const searchParams = useSearchParams()
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [filteredTrucks, setFilteredTrucks] = useState<Truck[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)
  const [sortBy, setSortBy] = useState<SortBy>('newest')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  // Remounting the sidebar is what clears its own checkboxes on "Clear All"
  const [filtersKey, setFiltersKey] = useState(0)

  const fetchTrucks = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch all certified trucks from database (increase limit to get all trucks)
      let certifiedTrucks: any[] = []
      try {
        const certifiedResponse = await fetch('/api/trucks?limit=500', { cache: 'no-store' })
        if (!certifiedResponse.ok) {
          console.error('Failed to fetch trucks:', certifiedResponse.status, certifiedResponse.statusText)
        } else {
          const certifiedResult = await certifiedResponse.json()
          // Handle paginated response format
          certifiedTrucks = certifiedResult.trucks || (Array.isArray(certifiedResult) ? certifiedResult : [])
        }
      } catch (error) {
        console.error('Error fetching certified trucks:', error)
      }
      
      // Fetch approved truck submissions
      let submissions: any[] = []
      try {
        const submissionsResponse = await fetch('/api/truck-submissions?status=approved', {
          cache: 'no-store',
        })
        if (!submissionsResponse.ok) {
          console.error('Failed to fetch submissions:', submissionsResponse.status, submissionsResponse.statusText)
        } else {
          const submissionsResult = await submissionsResponse.json()
          // Handle paginated response format
          submissions = submissionsResult.submissions || (Array.isArray(submissionsResult) ? submissionsResult : [])
        }
      } catch (error) {
        console.error('Error fetching truck submissions:', error)
      }
      
      // Transform certified trucks
      const formattedCertified: Truck[] = certifiedTrucks.map((truck: any) => {
        // Parse features if available
        let features: string[] = []
        if (truck.features) {
          try {
            features = typeof truck.features === 'string' ? JSON.parse(truck.features) : truck.features
            if (!Array.isArray(features)) features = []
          } catch (e) {
            features = []
          }
        }
        
        const formattedPrice = (() => {
          if (typeof truck.price === 'number' && Number.isFinite(truck.price)) {
            return `₹${truck.price.toLocaleString('en-IN')}`
          }
          const raw = (truck.price ?? '').toString().trim()
          if (!raw) return '₹0'
          if (raw.startsWith('₹')) return raw.replace(/\s+/g, ' ').trim()
          const numeric = raw.replace(/[^\d.]/g, '')
          const num = Number(numeric)
          if (!Number.isFinite(num) || num <= 0) return raw
          return `₹${num.toLocaleString('en-IN')}`
        })()

        const kilometers = typeof truck.kilometers === 'number' ? truck.kilometers : null
        const ownerNumber = typeof truck.ownership_number === 'number' ? truck.ownership_number : 1
        const fuelType = (truck.fuel_type as string | null | undefined) || null
        const transmission = (truck.transmission as string | null | undefined) || null

        return {
        id: truck.id,
        name: truck.name || `${truck.year} ${truck.manufacturer} ${truck.model}`,
        year: truck.year,
        price: formattedPrice,
        mileage: `${(kilometers ?? 0).toLocaleString('en-IN')} km`,
        engine: fuelType ?? 'Diesel',
        transmission: transmission ?? 'Manual',
        location: formatTruckListingLocation(truck),
        image: resolveTruckListImageUrl(truck),
        certified: truck.certified ?? true,
        manufacturer: truck.manufacturer,
        model: truck.model,
          features: features,
          owner: ordinalOwner(ownerNumber),
          ownerNumber,
          brand: brandName(truck.manufacturer),
          rtoState: truck.rto_state ?? null
        }
      })
      
      // Transform submissions
      const formattedSubmissions: Truck[] = submissions.map((sub: any) => {
        let imageUrl = '/default-truck.png'
        try {
          if (sub.images) {
            const images = typeof sub.images === 'string' ? JSON.parse(sub.images) : sub.images
            imageUrl = Array.isArray(images) && images.length > 0 ? images[0] : imageUrl
          }
        } catch (e) {
          console.warn('Error parsing images for submission:', sub.id)
        }
        
        // Parse features if available
        let features: string[] = []
        if (sub.features) {
          try {
            features = typeof sub.features === 'string' ? JSON.parse(sub.features) : sub.features
            if (!Array.isArray(features)) features = []
          } catch (e) {
            features = []
          }
        }
        
        const ownerNumber = sub.ownerNumber || 1
        
        return {
          id: sub.id + 10000, // Offset ID to avoid conflicts
          name: sub.registrationNumber || `${sub.year} ${sub.manufacturer} ${sub.model}`,
          year: sub.year,
          price: `₹${parseFloat(sub.askingPrice.toString()).toLocaleString('en-IN')}`,
          mileage: `${sub.kilometers?.toLocaleString() || '0'} km`,
          engine: sub.fuelType || 'Diesel',
          transmission: sub.transmission || 'Manual',
          location: `${sub.city || 'Unknown'}, ${sub.state || 'Unknown'}`,
          image: imageUrl,
          certified: sub.certified ?? false,
          features: features,
          owner: ordinalOwner(ownerNumber),
          ownerNumber,
          brand: brandName(sub.manufacturer)
        }
      })
      
      // Combine both datasets
      const allTrucks = [...formattedCertified, ...formattedSubmissions]
      
      console.log(`✅ Loaded ${allTrucks.length} trucks total (${formattedCertified.length} certified, ${formattedSubmissions.length} submissions)`)
      console.log('Sample truck names:', allTrucks.slice(0, 5).map(t => t.name))
      
      setTrucks(allTrucks)
      setFilteredTrucks(allTrucks)
    } catch (error) {
      console.error('Error in fetchTrucks:', error)
      // Set empty arrays on error instead of dummy data
      setTrucks([])
      setFilteredTrucks([])
    } finally {
      setLoading(false)
    }
  }, [])

  const applyFilters = useCallback(() => {
    let filtered = [...trucks]

    console.log('=== APPLYING FILTERS ===')
    console.log('Total trucks:', trucks.length)
    console.log('Filters:', filters)
    console.log('Truck names:', trucks.map(t => t.name).slice(0, 10))

    // Search filter - filter by truck name, manufacturer, or model
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim()
      filtered = filtered.filter(truck => {
        return truck.name.toLowerCase().includes(query) || (truck.brand || '').toLowerCase().includes(query)
      })
      console.log('After search filter:', filtered.length)
    }

    // Price filter - convert price string to rupees for comparison
    filtered = filtered.filter(truck => {
      // Remove currency symbol and commas, then parse as rupees
      const priceInRupees = priceValue(truck.price)
      const passes = priceInRupees >= filters.priceMin && priceInRupees <= filters.priceMax
      if (!passes) {
        console.log(`Price filter removed: ${truck.name} (₹${priceInRupees})`)
      }
      return passes
    })
    console.log('After price filter:', filtered.length)

    console.log('After price filter:', filtered.length)

    // Brand filter
    if (filters.selectedBrands && filters.selectedBrands.length > 0) {
      filtered = filtered.filter(truck => !!truck.brand && filters.selectedBrands.includes(truck.brand))
      console.log('After brand filter:', filtered.length)
    }

    // Year filter - any of the ticked ranges
    if (filters.selectedYears.length > 0) {
      filtered = filtered.filter(truck => filters.selectedYears.some(range => {
        if (range === 'Before 2009') return truck.year <= 2008
        const m = range.match(/(\d{4})\s*-\s*(\d{4})/)
        return !!m && truck.year >= parseInt(m[1]) && truck.year <= parseInt(m[2])
      }))
      console.log('After year filter:', filtered.length)
    }

    // KM Driven filter - any of the ticked ranges
    if (filters.selectedKmRanges.length > 0) {
      filtered = filtered.filter(truck => {
        const km = parseInt(truck.mileage.replace(/[^0-9]/g, ''))
        return filters.selectedKmRanges.some(range => {
          if (range === 'Less than 10,000 km') return km <= 9999
          if (range === 'More than 2,00,000 km') return km >= 200000
          const m = range.match(/(\d{1,3}(?:,\d{2,3})*)\s*-\s*(\d{1,3}(?:,\d{2,3})*)/)
          return !!m && km >= parseInt(m[1].replace(/,/g, '')) && km <= parseInt(m[2].replace(/,/g, ''))
        })
      })
      console.log('After KM filter:', filtered.length)
    }

    // Fuel Type filter
    if (filters.selectedFuelTypes && filters.selectedFuelTypes.length > 0) {
      filtered = filtered.filter(truck =>
        filters.selectedFuelTypes.includes(truck.engine)
      )
      console.log('After fuel type filter:', filtered.length)
    }

    // Owner filter - "5+ Owner" is 5 or more; the rest name one count ("2nd Owner")
    if (filters.selectedOwners.length > 0) {
      filtered = filtered.filter(truck => {
        if (!truck.ownerNumber) return false
        return filters.selectedOwners.some(owner => {
          const wanted = parseInt(owner)
          return owner.includes('+') ? truck.ownerNumber! >= wanted : truck.ownerNumber === wanted
        })
      })
      console.log('After owner filter:', filtered.length)
    }

    // Transmission filter (if needed)
    if (filters.transmission) {
      filtered = filtered.filter(truck =>
        truck.transmission.toLowerCase() === filters.transmission.toLowerCase()
      )
      console.log('After transmission filter:', filtered.length)
    }

    // Location filter
    if (filters.location) {
      const locationMap: { [key: string]: string[] } = {
        'mumbai': ['Mumbai', 'mumbai', 'MH-01'],
        'delhi': ['Delhi', 'delhi', 'DL-01', 'New Delhi'],
        'delhi-ncr': ['Delhi', 'NCR', 'Gurugram', 'Noida', 'Faridabad', 'Ghaziabad', 'DL-01'],
        'gurugram': ['Gurugram', 'Gurgaon', 'gurugram', 'gurgaon'],
        'kanpur': ['Kanpur', 'kanpur', 'UP-78'],
        'lucknow': ['Lucknow', 'lucknow', 'UP-32'],
        'chandigarh': ['Chandigarh', 'chandigarh', 'CH-01'],
        'pune': ['Pune', 'pune', 'MH-12'],
        'kolkata': ['Kolkata', 'kolkata', 'Calcutta', 'WB-01'],
        'ahmedabad': ['Ahmedabad', 'ahmedabad', 'GJ-01']
      }
      
      const locationKeywords = locationMap[filters.location.toLowerCase()] || [filters.location]
      filtered = filtered.filter(truck => {
        const truckLocation = truck.location.toLowerCase()
        return locationKeywords.some(keyword => 
          truckLocation.includes(keyword.toLowerCase())
        )
      })
      console.log('After location filter:', filtered.length)
    }

    // State filter - the state the truck's plate was registered in
    if (filters.selectedStates.length > 0) {
      filtered = filtered.filter(truck => !!truck.rtoState && filters.selectedStates.includes(truck.rtoState))
      console.log('After state filter:', filtered.length)
    }

    console.log('FINAL FILTERED TRUCKS:', filtered.length)
    console.log('======================')
    setFilteredTrucks(filtered)
  }, [filters, trucks])

  useEffect(() => {
    // Read location and search from URL query parameters
    const locationParam = searchParams.get('location')
    const searchParam = searchParams.get('search')
    
    if (locationParam) {
      setFilters(prev => ({ ...prev, location: locationParam }))
    }
    
    // Store search query in state (will be used in filtering)
    if (searchParam !== null) {
      setFilters(prev => ({ ...prev, searchQuery: searchParam }))
    } else {
      setFilters(prev => ({ ...prev, searchQuery: '' }))
    }
    
    fetchTrucks()
  }, [searchParams, fetchTrucks])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const isAnyFilterApplied = () =>
    (Object.keys(DEFAULT_FILTERS) as Array<keyof typeof DEFAULT_FILTERS>).some((key) => {
      const value = filters[key]
      const initial = DEFAULT_FILTERS[key]
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'string') return value.trim() !== ''
      return value !== initial
    })

  const clearAllFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setFiltersKey((k) => k + 1)
    // Clear search from URL
    const url = new URL(window.location.href)
    url.searchParams.delete('search')
    window.history.replaceState({}, '', url.pathname + url.search)
  }

  const handleFilterChange = useCallback((newFilters: Partial<typeof DEFAULT_FILTERS>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const brands = [...new Set(trucks.map(t => t.brand).filter((b): b is string => !!b))].sort()
  const states = [...new Set(trucks.map(t => t.rtoState).filter((s): s is string => !!s))].sort()

  return (
    <div className="browse-trucks-page">
      <Navbar />
      
      <div className="browse-trucks-container">
        {/* Mobile Overlay */}
        {showFilters && (
          <div 
            className="browse-filters-overlay"
            onClick={() => setShowFilters(false)}
          />
        )}

        {/* Mobile Action Buttons */}
        <div className="browse-action-buttons">
          <button 
            className="browse-action-btn sort-btn"
            onClick={() => setShowSort(!showSort)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M7 12h10M11 18h2"/>
            </svg>
            <span>Sort</span>
          </button>
          {showSort && (
            <div className="browse-sort-menu" role="listbox" aria-label="Sort trucks">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  role="option"
                  aria-selected={sortBy === option.value}
                  className={`browse-sort-option ${sortBy === option.value ? 'active' : ''}`}
                  onClick={() => {
                    setSortBy(option.value)
                    setShowSort(false)
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
          <button 
            className="browse-action-btn filters-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            <span>Filters</span>
          </button>
          {isAnyFilterApplied() && (
            <button 
              className="browse-action-btn clear-all-btn"
              onClick={clearAllFilters}
            >
              Clear All
            </button>
          )}
        </div>

        {/* Left Sidebar - Filters */}
        <aside className={`browse-filters-sidebar ${showFilters ? 'mobile-open' : ''}`}>
          <BrowseFilters 
            key={filtersKey}
            brands={brands}
            states={states}
            onFilterChange={handleFilterChange}
            totalCars={filteredTrucks.length}
            onClose={() => setShowFilters(false)}
            hasActiveFilters={isAnyFilterApplied()}
            onClear={clearAllFilters}
          />
        </aside>

        {/* Right Content - Truck Cards */}
        <main className="browse-trucks-content">
          <div className="browse-trucks-header">
            <h1 className="browse-trucks-title">Browse All Trucks</h1>
            <div className="browse-trucks-count-wrapper">
              <p className="browse-trucks-count">Found {filteredTrucks.length} trucks</p>
              <select
                className="browse-sort-select"
                aria-label="Sort trucks"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {isAnyFilterApplied() && (
                <button 
                  onClick={clearAllFilters}
                  className="clear-all-main-btn"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="browse-trucks-loading">
              <div className="loading-spinner"></div>
              <p>Loading trucks...</p>
            </div>
          ) : filteredTrucks.length === 0 ? (
            <div className="browse-trucks-empty">
              <p>No trucks found matching your criteria.</p>
              <button 
                onClick={clearAllFilters}
                className="reset-filters-btn"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="browse-trucks-grid">
              {sortTrucks(filteredTrucks, sortBy).map((truck) => (
                <TruckCard key={truck.id} truck={truck} />
              ))}
            </div>
          )}
        </main>
      </div>
      
      <Footer />
    </div>
  )
}

export default function BrowseTrucks() {
  return (
    <Suspense fallback={
      <div className="browse-trucks-page">
        <Navbar />
        <div className="browse-trucks-loading">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    }>
      <BrowseTrucksContent />
    </Suspense>
  )
}
