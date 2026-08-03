'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Helper to check if image is external
const isExternalImage = (src: string) => {
  return src?.startsWith('http') || src?.includes('supabase.co')
}

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
  manufacturer?: string
  model?: string
}

interface TruckCardProps {
  truck: Truck
}

export default function TruckCard({ truck }: TruckCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const router = useRouter()

  const handleViewDetails = () => {
    // Navigate to the full truck details page in the same tab
    router.push(`/truck/${truck.id}`)
  }

  return (
    <>
      <div className="truck-card-apple">
        {/* Image Section */}
        <div className="truck-card-image-apple">
          {truck.image && truck.image !== '' ? (
            isExternalImage(truck.image) ? (
              <img
                src={truck.image}
                alt={truck.name}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
                className="truck-card-img"
              />
            ) : (
              <Image
                src={truck.image}
                alt={truck.name}
                fill
                style={{ objectFit: 'cover' }}
                className="truck-card-img"
              />
            )
          ) : (
            <div className="truck-card-image-placeholder">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
          )}
          <div className="truck-card-overlay">
            {truck.certified && (
              <span className="truck-badge-certified-apple">✓ Certified</span>
            )}
            <button 
              className="truck-favorite-btn"
              onClick={() => setIsFavorite(!isFavorite)}
              aria-label="Add to favorites"
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill={isFavorite ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
            <div className="truck-card-text-overlay">
              <h3 className="truck-card-name-overlay">{truck.name || (truck.manufacturer && truck.model ? `${truck.manufacturer} ${truck.model}` : '')}</h3>
              <p className="truck-card-subtitle-overlay">{truck.year}</p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="truck-card-content-apple">
          {/* Specs */}
          <div className="truck-card-specs-apple">
            <div className="truck-spec-apple">
              <span className="truck-spec-value-apple">{truck.mileage}</span>
              <span className="truck-spec-label-apple">Mileage</span>
            </div>
            <div className="truck-spec-divider"></div>
            <div className="truck-spec-apple">
              <span className="truck-spec-value-apple">{truck.engine}</span>
              <span className="truck-spec-label-apple">Engine</span>
            </div>
            <div className="truck-spec-divider"></div>
            <div className="truck-spec-apple">
              <span className="truck-spec-value-apple">{truck.transmission}</span>
              <span className="truck-spec-label-apple">Trans</span>
            </div>
          </div>

          {/* Location */}
          <div className="truck-card-location">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Location: {truck.location}</span>
          </div>

          {/* Footer */}
          <div className="truck-card-footer-apple">
            <div className="truck-card-price-apple">{truck.price}</div>
            <button 
              className="truck-card-cta-apple" 
              onClick={handleViewDetails}
            >
              View Details →
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
