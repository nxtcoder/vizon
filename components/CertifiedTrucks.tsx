'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { resolveTruckListImageUrl } from '@/lib/truck-listing-images'
import { formatTruckListingLocation } from '@/lib/utils'

interface TruckSpec {
  year: string
  km: string
  hp: string
}

interface TruckCardProps {
  badge: string
  name: string
  subtitle: string
  specs: TruckSpec
  price: string
  image?: string
  gradient: string
  onInquire: () => void
}

const TruckCard = ({ badge, name, subtitle, specs, price, image, gradient, onInquire }: TruckCardProps) => {
  return (
    <div className="truck-card-apple">
      <div className="truck-card-image-apple">
        {image && (
          <Image
            src={image}
            alt={name}
            fill
            style={{ objectFit: 'cover' }}
            className="truck-card-img"
            unoptimized
          />
        )}
        <div className="truck-card-overlay">
          <div className="truck-badge-certified-apple">{badge}</div>
          <div className="truck-card-text-overlay">
            <h3 className="truck-card-name-overlay">{name}</h3>
            <p className="truck-card-subtitle-overlay">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="truck-card-content-apple">
        <div className="truck-card-specs-apple">
          <div className="truck-spec-apple">
            <span className="truck-spec-value-apple">{specs.year}</span>
            <span className="truck-spec-label-apple">Year</span>
          </div>
          <div className="truck-spec-divider"></div>
          <div className="truck-spec-apple">
            <span className="truck-spec-value-apple">{specs.km}</span>
            <span className="truck-spec-label-apple">KM</span>
          </div>
          <div className="truck-spec-divider"></div>
          <div className="truck-spec-apple">
            <span className="truck-spec-value-apple">{specs.hp}</span>
            <span className="truck-spec-label-apple">HP</span>
          </div>
        </div>
        <div className="truck-card-footer-apple">
          <div className="truck-card-price-apple">{price}</div>
          <button className="truck-card-cta-apple" onClick={onInquire}>View Details →</button>
        </div>
      </div>
    </div>
  )
}

export default function CertifiedTrucks() {
  const [trucks, setTrucks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchTrucks()
  }, [])

  const fetchTrucks = async () => {
    try {
      const response = await fetch('/api/trucks?limit=200', { cache: 'no-store' })
      const data = await response.json()

      const formatTrucks = (rawTrucks: any[]) => {
        return (rawTrucks || []).map((truck: any) => {
          const formattedFallbackPrice = (() => {
            const basePrice = typeof truck.price === 'number' ? truck.price : null
            if (typeof basePrice === 'number' && Number.isFinite(basePrice)) {
              return `₹${basePrice.toLocaleString('en-IN')}`
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
          const horsepower = typeof truck.horsepower === 'number' ? truck.horsepower : null

          const fuelType = (truck.fuel_type as string | null | undefined) || null
          const transmission = (truck.transmission as string | null | undefined) || null

          return {
            id: truck.id,
            name: truck.name || `${truck.year} ${truck.manufacturer} ${truck.model}`,
            year: truck.year,
            price: formattedFallbackPrice,
            mileage: `${(kilometers ?? 0).toLocaleString('en-IN')} km`,
            engine: fuelType ?? 'Diesel',
            kilometers,
            horsepower,
            transmission: transmission ?? 'Manual',
            location: formatTruckListingLocation(truck),
            image: resolveTruckListImageUrl(truck),
            certified: truck.certified ?? true,
            manufacturer: truck.manufacturer,
            model: truck.model,
          }
        })
      }

      // Handle new paginated response format
      if (response.ok) {
        if (data.trucks && Array.isArray(data.trucks)) {
          setTrucks(formatTrucks(data.trucks))
        } else if (Array.isArray(data)) {
          setTrucks(formatTrucks(data))
        } else {
          console.error('Error fetching trucks: Invalid response format')
          setTrucks([])
        }
      } else {
        // Handle error response
        console.error('Error fetching trucks:', data.error || 'Unknown error')
        setTrucks([])
      }
    } catch (error) {
      console.error('Error fetching trucks:', error)
      setTrucks([])
    } finally {
      setLoading(false)
    }
  }

  const handleInquire = (truckId: number) => {
    // Navigate to the full truck details page in the same tab
    router.push(`/truck/${truckId}`)
  }

  if (loading) {
    return (
      <section className="certified-trucks-section">
        <div className="certified-trucks-container">
          <h2 className="certified-trucks-heading">Curated & Certified Trucks</h2>
          <div className="truck-cards-grid">
            <p>Loading trucks...</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="certified-trucks-section" id="certified-trucks">
      <div className="certified-trucks-container">
        <h2 className="certified-trucks-heading">Curated & Certified Trucks</h2>
        <div className="truck-cards-grid">
          {trucks.length > 0 ? (
            trucks.map((truck) => (
              <TruckCard
                key={truck.id}
                badge="Axlerator Certified"
                name={truck.name || (truck.manufacturer && truck.model ? `${truck.manufacturer} ${truck.model}` : '')}
                subtitle={truck.year?.toString() || truck.subtitle || 'Premium quality truck'}
                specs={{
                  year: truck.year?.toString() ?? '–',
                  km: typeof truck.kilometers === 'number' ? truck.kilometers.toLocaleString('en-IN') : '–',
                  hp: typeof truck.horsepower === 'number' ? String(truck.horsepower) : '–'
                }}
                price={typeof truck.price === 'string' ? truck.price : `₹${Number(truck.price || 0).toLocaleString('en-IN')}`}
                image={truck.image}
                gradient="linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%)"
                onInquire={() => handleInquire(truck.id)}
              />
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              <p>No trucks available at the moment. Please check back later.</p>
            </div>
          )}
        </div>
        <div className="browse-all-container">
          <button className="browse-all-btn" onClick={() => window.location.href = '/browse-trucks'}>
            Browse All Trucks
          </button>
        </div>
      </div>
    </section>
  )
}
