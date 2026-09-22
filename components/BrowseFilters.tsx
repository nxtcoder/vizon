'use client'

import { useState, useEffect, useCallback } from 'react'

interface BrowseFiltersProps {
  onFilterChange: (filters: any) => void
  totalCars: number
  onClose?: () => void
  /** Brands of the listed trucks; only these are offered. */
  brands: string[]
  /** RTO codes ("DL-01") of the listed trucks, from their plates; only these are offered. */
  rtoCodes: string[]
}

// City names for RTO codes, written "City (CODE)".
const RTO_LOCATIONS = [
    // Maharashtra
    'Mumbai (MH-01)', 'Mumbai (MH-02)', 'Mumbai (MH-03)', 'Mumbai (MH-43)', 'Mumbai (MH-47)',
    'Pune (MH-12)', 'Pune (MH-14)', 'Nagpur (MH-31)', 'Nashik (MH-15)', 'Aurangabad (MH-20)',
    'Thane (MH-04)', 'Solapur (MH-13)', 'Kolhapur (MH-09)', 'Sangli (MH-10)', 'Satara (MH-11)',
    'Jalgaon (MH-19)', 'Akola (MH-30)', 'Amravati (MH-27)', 'Latur (MH-24)', 'Nanded (MH-26)',
    'Ratnagiri (MH-08)', 'Dhule (MH-18)', 'Chandrapur (MH-34)', 'Beed (MH-23)', 'Parbhani (MH-22)',
    // Delhi
    'Delhi (DL-01)', 'Delhi (DL-02)', 'Delhi (DL-03)', 'Delhi (DL-04)', 'Delhi (DL-05)',
    'Delhi (DL-06)', 'Delhi (DL-07)', 'Delhi (DL-08)', 'Delhi (DL-09)', 'Delhi (DL-10)',
    'Delhi (DL-11)', 'Delhi (DL-12)', 'Delhi (DL-13)', 'Delhi (DL-14)', 'Delhi (DL-15)',
    // Karnataka
    'Bangalore (KA-01)', 'Bangalore (KA-02)', 'Bangalore (KA-03)', 'Bangalore (KA-04)', 'Bangalore (KA-05)',
    'Bangalore (KA-50)', 'Bangalore (KA-51)', 'Bangalore (KA-52)', 'Bangalore (KA-53)', 'Mysore (KA-09)',
    'Mangalore (KA-19)', 'Hubli (KA-25)', 'Belgaum (KA-22)', 'Gulbarga (KA-29)', 'Davangere (KA-17)',
    'Shimoga (KA-14)', 'Tumkur (KA-06)', 'Raichur (KA-36)', 'Bijapur (KA-28)', 'Bellary (KA-34)',
    // Telangana
    'Hyderabad (TS-09)', 'Hyderabad (TS-07)', 'Hyderabad (TS-08)', 'Hyderabad (TS-10)', 'Hyderabad (TS-11)',
    'Hyderabad (TS-12)', 'Hyderabad (TS-13)', 'Hyderabad (TS-14)', 'Hyderabad (TS-15)', 'Warangal (TS-03)',
    'Nizamabad (TS-16)', 'Karimnagar (TS-02)', 'Khammam (TS-04)', 'Mahbubnagar (TS-06)', 'Nalgonda (TS-05)',
    // Tamil Nadu
    'Chennai (TN-01)', 'Chennai (TN-02)', 'Chennai (TN-03)', 'Chennai (TN-04)', 'Chennai (TN-05)',
    'Chennai (TN-07)', 'Chennai (TN-09)', 'Chennai (TN-10)', 'Chennai (TN-11)', 'Chennai (TN-12)',
    'Coimbatore (TN-37)', 'Madurai (TN-58)', 'Salem (TN-30)', 'Tirunelveli (TN-72)', 'Tiruchirappalli (TN-45)',
    'Erode (TN-33)', 'Vellore (TN-23)', 'Dindigul (TN-57)', 'Thanjavur (TN-49)', 'Tiruppur (TN-39)',
    // West Bengal
    'Kolkata (WB-01)', 'Kolkata (WB-02)', 'Kolkata (WB-03)', 'Kolkata (WB-04)', 'Kolkata (WB-05)',
    'Kolkata (WB-06)', 'Kolkata (WB-07)', 'Kolkata (WB-08)', 'Kolkata (WB-09)', 'Kolkata (WB-10)',
    'Howrah (WB-11)', 'Hooghly (WB-15)', 'Burdwan (WB-37)', 'Asansol (WB-38)', 'Siliguri (WB-73)',
    'Durgapur (WB-39)', 'Kharagpur (WB-33)', 'Barasat (WB-26)', 'Barrackpore (WB-24)', 'Krishnanagar (WB-53)',
    // Gujarat
    'Ahmedabad (GJ-01)', 'Ahmedabad (GJ-27)', 'Surat (GJ-05)', 'Surat (GJ-19)', 'Vadodara (GJ-06)',
    'Rajkot (GJ-03)', 'Bhavnagar (GJ-04)', 'Jamnagar (GJ-10)', 'Gandhinagar (GJ-18)', 'Anand (GJ-23)',
    'Bharuch (GJ-16)', 'Mehsana (GJ-02)', 'Palanpur (GJ-08)', 'Junagadh (GJ-11)', 'Bhuj (GJ-12)',
    // Rajasthan
    'Jaipur (RJ-14)', 'Jaipur (RJ-13)', 'Jaipur (RJ-02)', 'Jodhpur (RJ-19)', 'Kota (RJ-20)',
    'Udaipur (RJ-27)', 'Bikaner (RJ-04)', 'Ajmer (RJ-01)', 'Bharatpur (RJ-05)', 'Alwar (RJ-02)',
    'Sikar (RJ-23)', 'Pali (RJ-22)', 'Sri Ganganagar (RJ-13)', 'Bhilwara (RJ-06)', 'Chittorgarh (RJ-08)',
    // Uttar Pradesh
    'Lucknow (UP-32)', 'Kanpur (UP-78)', 'Agra (UP-80)', 'Varanasi (UP-65)', 'Allahabad (UP-70)',
    'Meerut (UP-15)', 'Ghaziabad (UP-14)', 'Noida (UP-16)', 'Bareilly (UP-25)', 'Aligarh (UP-81)',
    'Moradabad (UP-21)', 'Saharanpur (UP-11)', 'Gorakhpur (UP-53)', 'Faizabad (UP-42)', 'Jhansi (UP-93)',
    'Mathura (UP-85)', 'Muzaffarnagar (UP-12)', 'Rampur (UP-22)', 'Shahjahanpur (UP-26)', 'Firozabad (UP-83)',
    // Madhya Pradesh
    'Indore (MP-09)', 'Bhopal (MP-04)', 'Gwalior (MP-07)', 'Jabalpur (MP-20)',
    'Ujjain (MP-10)', 'Sagar (MP-15)', 'Rewa (MP-17)', 'Satna (MP-19)', 'Ratlam (MP-43)',
    'Dewas (MP-13)', 'Burhanpur (MP-48)', 'Khandwa (MP-12)', 'Chhindwara (MP-28)', 'Dhar (MP-11)',
    // Punjab
    'Chandigarh (CH-01)', 'Chandigarh (CH-02)', 'Chandigarh (CH-03)', 'Chandigarh (CH-04)',
    'Amritsar (PB-02)', 'Ludhiana (PB-10)', 'Jalandhar (PB-08)', 'Patiala (PB-11)', 'Bathinda (PB-03)',
    'Mohali (PB-12)', 'Hoshiarpur (PB-07)', 'Pathankot (PB-13)', 'Ferozepur (PB-05)', 'Sangrur (PB-13)',
    // Haryana
    'Gurgaon (HR-26)', 'Gurgaon (HR-55)', 'Faridabad (HR-51)', 'Faridabad (HR-38)', 'Jhajjar (HR-63)', 'Sonipat (HR-69)', 'Panipat (HR-06)', 'Karnal (HR-05)',
    'Ambala (HR-01)', 'Yamunanagar (HR-02)', 'Rohtak (HR-13)', 'Hisar (HR-20)', 'Sonipat (HR-14)',
    'Rewari (HR-36)', 'Bhiwani (HR-19)', 'Sirsa (HR-31)', 'Jind (HR-15)', 'Kaithal (HR-08)',
    // Kerala
    'Thiruvananthapuram (KL-01)', 'Kochi (KL-07)', 'Kozhikode (KL-11)', 'Thrissur (KL-08)', 'Kannur (KL-13)',
    'Kollam (KL-02)', 'Alappuzha (KL-04)', 'Palakkad (KL-09)', 'Malappuram (KL-10)', 'Kottayam (KL-05)',
    // Odisha
    'Bhubaneswar (OD-02)', 'Cuttack (OD-05)', 'Rourkela (OD-14)', 'Berhampur (OD-07)', 'Sambalpur (OD-15)',
    'Puri (OD-13)', 'Balasore (OD-01)', 'Jharsuguda (OD-20)', 'Angul (OD-19)', 'Bhadrak (OD-03)',
    // Bihar
    'Patna (BR-01)', 'Gaya (BR-02)', 'Muzaffarpur (BR-06)', 'Bhagalpur (BR-10)', 'Darbhanga (BR-04)',
    'Purnia (BR-13)', 'Ara (BR-03)', 'Katihar (BR-09)', 'Chapra (BR-05)', 'Motihari (BR-15)',
    // Jharkhand
    'Ranchi (JH-01)', 'Jamshedpur (JH-05)', 'Dhanbad (JH-10)', 'Bokaro (JH-09)', 'Hazaribagh (JH-02)',
    'Deoghar (JH-15)', 'Giridih (JH-11)', 'Dumka (JH-04)', 'Chaibasa (JH-20)', 'Ramgarh (JH-24)',
    // Assam
    'Guwahati (AS-01)', 'Silchar (AS-11)', 'Dibrugarh (AS-06)', 'Jorhat (AS-03)', 'Nagaon (AS-02)',
    'Tinsukia (AS-23)', 'Tezpur (AS-12)', 'Barpeta (AS-15)', 'Goalpara (AS-18)', 'Karimganj (AS-19)',
    // Chhattisgarh
    'Raipur (CG-04)', 'Bhilai (CG-07)', 'Bilaspur (CG-10)', 'Durg (CG-08)', 'Korba (CG-12)',
    'Raigarh (CG-13)', 'Jagdalpur (CG-14)', 'Ambikapur (CG-15)', 'Rajnandgaon (CG-11)', 'Dhamtari (CG-16)',
    // Uttarakhand
    'Dehradun (UK-07)', 'Haridwar (UK-08)', 'Nainital (UK-04)', 'Udham Singh Nagar (UK-06)', 'Almora (UK-01)',
    'Pithoragarh (UK-05)', 'Chamoli (UK-03)', 'Pauri (UK-12)', 'Tehri (UK-09)', 'Rudraprayag (UK-13)',
    // Himachal Pradesh
    'Shimla (HP-01)', 'Solan (HP-14)', 'Kangra (HP-38)', 'Mandi (HP-26)', 'Hamirpur (HP-22)',
    'Una (HP-73)', 'Bilaspur (HP-24)', 'Chamba (HP-33)', 'Kullu (HP-34)', 'Sirmaur (HP-17)',
    // Andhra Pradesh
    'Visakhapatnam (AP-31)', 'Vijayawada (AP-16)', 'Guntur (AP-07)', 'Nellore (AP-26)', 'Tirupati (AP-03)',
    'Kurnool (AP-21)', 'Rajahmundry (AP-05)', 'Kakinada (AP-04)', 'Anantapur (AP-02)', 'Kadapa (AP-04)',
    // Goa
    'Panaji (GA-01)', 'Margao (GA-02)', 'Mapusa (GA-03)', 'Vasco (GA-06)', 'Ponda (GA-12)',
    // Manipur
    'Imphal (MN-01)', 'Thoubal (MN-02)', 'Bishnupur (MN-03)', 'Churachandpur (MN-04)',
    // Meghalaya
    'Shillong (ML-05)', 'Tura (ML-08)', 'Jowai (ML-10)', 'Nongpoh (ML-11)',
    // Mizoram
    'Aizawl (MZ-01)', 'Lunglei (MZ-02)', 'Champhai (MZ-03)', 'Serchhip (MZ-04)',
    // Nagaland
    'Kohima (NL-01)', 'Dimapur (NL-07)', 'Mokokchung (NL-02)', 'Tuensang (NL-03)',
    // Tripura
    'Agartala (TR-01)', 'Udaipur (TR-02)', 'Kailasahar (TR-03)', 'Dharmanagar (TR-04)',
    // Sikkim
    'Gangtok (SK-01)', 'Namchi (SK-02)', 'Mangan (SK-03)', 'Gyalshing (SK-04)',
    // Arunachal Pradesh
    'Itanagar (AR-01)', 'Naharlagun (AR-12)', 'Pasighat (AR-11)', 'Tezu (AR-10)',
    // Puducherry
    'Puducherry (PY-01)', 'Karaikal (PY-02)', 'Mahe (PY-03)', 'Yanam (PY-04)',
    // Jammu & Kashmir
    'Srinagar (JK-01)', 'Jammu (JK-02)', 'Anantnag (JK-03)', 'Baramulla (JK-04)', 'Udhampur (JK-14)',
    // Ladakh
    'Leh (LA-01)', 'Kargil (LA-02)',
    // Andaman & Nicobar
    'Port Blair (AN-01)', 'Car Nicobar (AN-02)',
    // Dadra & Nagar Haveli and Daman & Diu
    'Daman (DD-01)', 'Diu (DD-02)', 'Silvassa (DD-03)'
  ]

/** "DL-01" -> "Delhi (DL-01)"; a code with no known city is shown as the code. */
export const rtoLabel = (code: string) => RTO_LOCATIONS.find((l) => l.endsWith(`(${code})`)) || code

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

export default function BrowseFilters({ onFilterChange, totalCars, onClose, brands, rtoCodes }: BrowseFiltersProps) {
  const [isPriceRangeOpen, setIsPriceRangeOpen] = useState(true)
  const [isBrandOpen, setIsBrandOpen] = useState(false)
  const [isYearOpen, setIsYearOpen] = useState(false)
  const [isKmDrivenOpen, setIsKmDrivenOpen] = useState(false)
  const [isFuelTypeOpen, setIsFuelTypeOpen] = useState(false)
  const [isOwnerOpen, setIsOwnerOpen] = useState(false)
  const [isRTOLocationOpen, setIsRTOLocationOpen] = useState(false)

  const [priceMin, setPriceMin] = useState(50000)
  const [priceMax, setPriceMax] = useState(7000000)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedKmDriven, setSelectedKmDriven] = useState('')
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>([])
  const [selectedOwner, setSelectedOwner] = useState('')
  const [selectedRTOLocation, setSelectedRTOLocation] = useState('')
  const [rtoSearchQuery, setRtoSearchQuery] = useState('')
  const rtoOptions = [...new Set(rtoCodes)].sort().map(rtoLabel)

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
      selectedRTOLocation
    })
  }, [priceMin, priceMax, selectedBrands, selectedYear, selectedKmDriven, 
      selectedFuelTypes, selectedOwner, selectedRTOLocation, onFilterChange])

  const handleReset = () => {
    setPriceMin(50000)
    setPriceMax(7000000)
    setSelectedBrands([])
    setSelectedYear('')
    setSelectedKmDriven('')
    setSelectedFuelTypes([])
    setSelectedOwner('')
    setSelectedRTOLocation('')
    setRtoSearchQuery('')
    onFilterChange({
      priceMin: 50000,
      priceMax: 7000000,
      selectedBrands: [],
      selectedYear: '',
      selectedKmDriven: '',
      selectedFuelTypes: [],
      selectedOwner: '',
      selectedRTOLocation: ''
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

      {/* RTO Location */}
      <div className="filter-section">
        <button 
          className="filter-section-header"
          onClick={() => setIsRTOLocationOpen(!isRTOLocationOpen)}
        >
          <span className="filter-section-title">
            RTO Location
          </span>
          <span className={`filter-arrow ${isRTOLocationOpen ? 'open' : ''}`}>
            {isRTOLocationOpen ? '−' : '+'}
          </span>
        </button>
        {isRTOLocationOpen && (
          <div className="filter-section-content">
            <input 
              type="text" 
              placeholder="Search RTO locations..." 
              className="filter-search-input"
              value={rtoSearchQuery}
              onChange={(e) => setRtoSearchQuery(e.target.value)}
            />
            <div className="filter-checkboxes" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {rtoOptions
              .filter(rto => 
                rtoSearchQuery === '' || 
                rto.toLowerCase().includes(rtoSearchQuery.toLowerCase())
              )
              .map(rto => (
                <label 
                  key={rto} 
                  className="filter-checkbox"
                  onClick={(e) => {
                    e.preventDefault()
                    setSelectedRTOLocation(selectedRTOLocation === rto ? '' : rto)
                  }}
                >
                  <input 
                    type="radio" 
                    name="rtoLocation"
                    checked={selectedRTOLocation === rto}
                    onChange={() => {}}
                    readOnly
                  />
                  <span>{rto}</span>
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
