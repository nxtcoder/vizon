'use client'

import { useState, useEffect, useCallback } from 'react'

interface BrowseFiltersProps {
  onFilterChange: (filters: any) => void
  totalCars: number
  onClose?: () => void
  /** Brands of the listed trucks; only these are offered. */
  brands: string[]
  /** States the listed trucks' plates were registered in; only these are offered. */
  states: string[]
}

/** Slider stops: 50K, then 1L steps to 15L, 5L to 20L, 10L to 70L. */
const PRICE_STEPS = [
  50000,
  ...Array.from({ length: 15 }, (_, i) => (i + 1) * 100000),
  2000000,
  ...Array.from({ length: 5 }, (_, i) => (i + 3) * 1000000),
]
const PRICE_FLOOR = PRICE_STEPS[0]
const PRICE_CEIL = PRICE_STEPS[PRICE_STEPS.length - 1]

/** Index of the last stop at or below the price, so a typed price still places the thumb. */
const priceStepIndex = (price: number) => {
  let i = 0
  while (i < PRICE_STEPS.length - 1 && PRICE_STEPS[i + 1] <= price) i++
  return i
}

const clampPrice = (price: number) => Math.min(PRICE_CEIL, Math.max(PRICE_FLOOR, price))

export default function BrowseFilters({ onFilterChange, totalCars, onClose, brands, states }: BrowseFiltersProps) {
  const [isPriceRangeOpen, setIsPriceRangeOpen] = useState(true)
  const [isBrandOpen, setIsBrandOpen] = useState(false)
  const [isYearOpen, setIsYearOpen] = useState(false)
  const [isKmDrivenOpen, setIsKmDrivenOpen] = useState(false)
  const [isFuelTypeOpen, setIsFuelTypeOpen] = useState(false)
  const [isOwnerOpen, setIsOwnerOpen] = useState(false)
  const [isStateOpen, setIsStateOpen] = useState(false)

  const [priceMin, setPriceMin] = useState(50000)
  const [priceMax, setPriceMax] = useState(7000000)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedKmDriven, setSelectedKmDriven] = useState('')
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>([])
  const [selectedOwner, setSelectedOwner] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [stateSearchQuery, setStateSearchQuery] = useState('')

  // Auto-apply filters whenever any filter value changes
  useEffect(() => {
    onFilterChange({
      priceMin,
      priceMax,
      selectedBrands,
      selectedYear,
      selectedKmDriven,
      selectedFuelTypes,
      selectedOwner,
      selectedState
    })
  }, [priceMin, priceMax, selectedBrands, selectedYear, selectedKmDriven, 
      selectedFuelTypes, selectedOwner, selectedState, onFilterChange])

  const handleReset = () => {
    setPriceMin(50000)
    setPriceMax(7000000)
    setSelectedBrands([])
    setSelectedYear('')
    setSelectedKmDriven('')
    setSelectedFuelTypes([])
    setSelectedOwner('')
    setSelectedState('')
    setStateSearchQuery('')
    onFilterChange({
      priceMin: 50000,
      priceMax: 7000000,
      selectedBrands: [],
      selectedYear: '',
      selectedKmDriven: '',
      selectedFuelTypes: [],
      selectedOwner: '',
      selectedState: ''
    })
  }

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    )
  }

  const toggleFuelType = (fuel: string) => {
    setSelectedFuelTypes(prev => 
      prev.includes(fuel) ? prev.filter(f => f !== fuel) : [...prev, fuel]
    )
  }

  return (
    <div className="browse-filters">
      {onClose && (
        <div className="browse-filters-mobile-header">
          <h3>Filters</h3>
          <button className="browse-filters-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}
      {/* Price Range */}
      <div className="filter-section">
        <button 
          className="filter-section-header"
          onClick={() => setIsPriceRangeOpen(!isPriceRangeOpen)}
        >
          <span className="filter-section-title">
            Price Range
          </span>
          <span className={`filter-arrow ${isPriceRangeOpen ? 'open' : ''}`}>
            {isPriceRangeOpen ? '−' : '+'}
          </span>
        </button>
        {isPriceRangeOpen && (
          <div className="filter-section-content">
            <div className="price-inputs">
              <div className="price-input-group">
                <label>Minimum:</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={`₹ ${priceMin.toLocaleString('en-IN')}`}
                  onChange={(e) => setPriceMin(parseInt(e.target.value.replace(/\D/g, '')) || 0)}
                  onBlur={() => setPriceMin(Math.min(clampPrice(priceMin), priceMax))}
                />
              </div>
              <div className="price-input-group">
                <label>Maximum:</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={`₹ ${priceMax.toLocaleString('en-IN')}`}
                  onChange={(e) => setPriceMax(parseInt(e.target.value.replace(/\D/g, '')) || 0)}
                  onBlur={() => setPriceMax(Math.max(clampPrice(priceMax), priceMin))}
                />
              </div>
            </div>
            
            <div className="price-range-slider">
              <input 
                type="range" 
                min={0} 
                max={PRICE_STEPS.length - 1} 
                step={1}
                value={priceStepIndex(priceMin)}
                onChange={(e) => setPriceMin(PRICE_STEPS[Math.min(parseInt(e.target.value), priceStepIndex(priceMax))])}
                className="range-input range-min"
              />
              <input 
                type="range" 
                min={0} 
                max={PRICE_STEPS.length - 1} 
                step={1}
                value={priceStepIndex(priceMax)}
                onChange={(e) => setPriceMax(PRICE_STEPS[Math.max(parseInt(e.target.value), priceStepIndex(priceMin))])}
                className="range-input range-max"
              />
            </div>
          </div>
        )}
      </div>

      {/* Brand */}
      <div className="filter-section">
        <button 
          className="filter-section-header"
          onClick={() => setIsBrandOpen(!isBrandOpen)}
        >
          <span className="filter-section-title">
            Brand
          </span>
          <span className={`filter-arrow ${isBrandOpen ? 'open' : ''}`}>
            {isBrandOpen ? '−' : '+'}
          </span>
        </button>
        {isBrandOpen && (
          <div className="filter-section-content">
            <input type="text" placeholder="Search brands..." className="filter-search-input" />
            <div className="filter-checkboxes">
              {brands.map(brand => (
                <label key={brand} className="filter-checkbox">
                  <input 
                    type="checkbox" 
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                  />
                  <span>{brand}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Year */}
      <div className="filter-section">
        <button 
          className="filter-section-header"
          onClick={() => setIsYearOpen(!isYearOpen)}
        >
          <span className="filter-section-title">
            Year
          </span>
          <span className={`filter-arrow ${isYearOpen ? 'open' : ''}`}>
            {isYearOpen ? '−' : '+'}
          </span>
        </button>
        {isYearOpen && (
          <div className="filter-section-content">
            <div className="filter-checkboxes">
              {[`2021 - ${new Date().getFullYear()}`, '2018 - 2020', '2015 - 2017', '2012 - 2014', '2009 - 2011', 'Before 2009'].map(year => (
                <label 
                  key={year} 
                  className="filter-checkbox"
                  onClick={(e) => {
                    e.preventDefault()
                    setSelectedYear(selectedYear === year ? '' : year)
                  }}
                >
                  <input 
                    type="radio" 
                    name="year"
                    checked={selectedYear === year}
                    onChange={() => {}}
                    readOnly
                  />
                  <span>{year}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* KM Driven */}
      <div className="filter-section">
        <button 
          className="filter-section-header"
          onClick={() => setIsKmDrivenOpen(!isKmDrivenOpen)}
        >
          <span className="filter-section-title">
            KM Driven
          </span>
          <span className={`filter-arrow ${isKmDrivenOpen ? 'open' : ''}`}>
            {isKmDrivenOpen ? '−' : '+'}
          </span>
        </button>
        {isKmDrivenOpen && (
          <div className="filter-section-content">
            <div className="filter-checkboxes">
              {['Less than 10,000 km', '10,000 - 25,000 km', '25,000 - 50,000 km', '50,000 - 75,000 km', '75,000 - 1,00,000 km', '1,00,000 - 1,50,000 km', '1,50,000 - 2,00,000 km', 'More than 2,00,000 km'].map(km => (
                <label 
                  key={km} 
                  className="filter-checkbox"
                  onClick={(e) => {
                    e.preventDefault()
                    setSelectedKmDriven(selectedKmDriven === km ? '' : km)
                  }}
                >
                  <input 
                    type="radio" 
                    name="kmDriven"
                    checked={selectedKmDriven === km}
                    onChange={() => {}}
                    readOnly
                  />
                  <span>{km}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fuel Type */}
      <div className="filter-section">
        <button 
          className="filter-section-header"
          onClick={() => setIsFuelTypeOpen(!isFuelTypeOpen)}
        >
          <span className="filter-section-title">
            Fuel Type
          </span>
          <span className={`filter-arrow ${isFuelTypeOpen ? 'open' : ''}`}>
            {isFuelTypeOpen ? '−' : '+'}
          </span>
        </button>
        {isFuelTypeOpen && (
          <div className="filter-section-content">
            <div className="filter-checkboxes">
              {['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'].map(fuel => (
                <label key={fuel} className="filter-checkbox">
                  <input 
                    type="checkbox" 
                    checked={selectedFuelTypes.includes(fuel)}
                    onChange={() => toggleFuelType(fuel)}
                  />
                  <span>{fuel}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Owner */}
      <div className="filter-section">
        <button 
          className="filter-section-header"
          onClick={() => setIsOwnerOpen(!isOwnerOpen)}
        >
          <span className="filter-section-title">
            Owner
          </span>
          <span className={`filter-arrow ${isOwnerOpen ? 'open' : ''}`}>
            {isOwnerOpen ? '−' : '+'}
          </span>
        </button>
        {isOwnerOpen && (
          <div className="filter-section-content">
            <div className="filter-checkboxes">
              {['1st Owner', '2nd Owner', '3rd Owner', '4th Owner', '5+ Owner'].map(owner => (
                <label 
                  key={owner} 
                  className="filter-checkbox"
                  onClick={(e) => {
                    e.preventDefault()
                    setSelectedOwner(selectedOwner === owner ? '' : owner)
                  }}
                >
                  <input 
                    type="radio" 
                    name="owner"
                    checked={selectedOwner === owner}
                    onChange={() => {}}
                    readOnly
                  />
                  <span>{owner}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* State */}
      <div className="filter-section">
        <button 
          className="filter-section-header"
          onClick={() => setIsStateOpen(!isStateOpen)}
        >
          <span className="filter-section-title">
            State
          </span>
          <span className={`filter-arrow ${isStateOpen ? 'open' : ''}`}>
            {isStateOpen ? '−' : '+'}
          </span>
        </button>
        {isStateOpen && (
          <div className="filter-section-content">
            <input 
              type="text" 
              placeholder="Search states..." 
              className="filter-search-input"
              value={stateSearchQuery}
              onChange={(e) => setStateSearchQuery(e.target.value)}
            />
            <div className="filter-checkboxes" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {states
              .filter(state => 
                stateSearchQuery === '' || 
                state.toLowerCase().includes(stateSearchQuery.toLowerCase())
              )
              .map(state => (
                <label 
                  key={state} 
                  className="filter-checkbox"
                  onClick={(e) => {
                    e.preventDefault()
                    setSelectedState(selectedState === state ? '' : state)
                  }}
                >
                  <input 
                    type="radio" 
                    name="state"
                    checked={selectedState === state}
                    onChange={() => {}}
                    readOnly
                  />
                  <span>{state}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Found Cars Count and Clear All Button */}
      <div className="filter-results">
        <p>Found trucks: <strong>{totalCars.toLocaleString()}</strong></p>
        <button 
          onClick={handleReset}
          className="clear-all-btn"
        >
          Clear All
        </button>
      </div>
    </div>
  )
}
