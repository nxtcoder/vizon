'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [navbarPadding, setNavbarPadding] = useState('0.8rem 0')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLFormElement>(null)

const SHOW_SELL_LOCATION_LINKS = false

const searchSuggestions = [
    'Heavy Duty Trucks',
    'Medium Duty Trucks',
    'Light Duty Trucks',
    'Trailers',
    'Certified Trucks',
    'Truck Financing',
    'Truck Insurance',
    'Get Valuation',
    'Sell My Truck',
    'Fleet Services',
  ]

  const filteredSuggestions = searchSuggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id]')
      const scrollY = window.pageYOffset

      sections.forEach(section => {
        const sectionHeight = section.clientHeight
        const sectionTop = (section as HTMLElement).offsetTop - 100
        const sectionId = section.getAttribute('id')
        
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          if (sectionId) {
            setActiveSection(sectionId)
          }
        }
      })

      // Navbar scroll effect
      if (window.scrollY > 50) {
        setNavbarPadding('0.5rem 0')
      } else {
        setNavbarPadding('0.8rem 0')
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    setIsMenuOpen(false)
    setOpenDropdown(null)
    
    const target = document.querySelector(targetId)
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown)
  }

  const handleMouseEnter = (dropdown: string) => {
    if (window.innerWidth > 768) {
      setOpenDropdown(dropdown)
    }
  }

  const handleMouseLeave = () => {
    if (window.innerWidth > 768) {
      setOpenDropdown(null)
    }
  }

  const handleDropdownClick = (e: React.MouseEvent<HTMLAnchorElement>, dropdown: string) => {
    // On mobile, toggle dropdown instead of navigating
    if (window.innerWidth <= 768) {
      // Only prevent navigation if there's actually a dropdown menu to show
      // For "sell-truck", only prevent if SHOW_SELL_LOCATION_LINKS is true
      if (dropdown === 'sell-truck' && !SHOW_SELL_LOCATION_LINKS) {
        // No dropdown menu, allow navigation
        setIsMenuOpen(false)
        return
      }
      // For other dropdowns or when dropdown exists, toggle it
      e.preventDefault()
      e.stopPropagation()
      toggleDropdown(dropdown)
    }
    // On desktop, let the link work normally (navigation handled by href)
  }

  // Close dropdown when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (window.innerWidth <= 768) {
        const target = event.target as HTMLElement
        if (!target.closest('.dropdown')) {
          setOpenDropdown(null)
        }
      }
    }

    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isMenuOpen])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    setShowSuggestions(true)
    
    // If on browse-trucks page, update URL with search query
    if (pathname === '/browse-trucks') {
      const url = new URL(window.location.href)
      if (query.trim()) {
        url.searchParams.set('search', query.trim())
      } else {
        url.searchParams.delete('search')
      }
      router.replace(url.pathname + url.search, { scroll: false })
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      if (pathname !== '/browse-trucks') {
        router.push(`/browse-trucks?search=${encodeURIComponent(searchQuery.trim())}`)
      }
    }
    setShowSuggestions(false)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    if (pathname !== '/browse-trucks') {
      router.push(`/browse-trucks?search=${encodeURIComponent(suggestion)}`)
    } else {
      const url = new URL(window.location.href)
      url.searchParams.set('search', suggestion)
      router.replace(url.pathname + url.search, { scroll: false })
    }
  }

  // Sync search query with URL when on browse-trucks page
  useEffect(() => {
    if (pathname === '/browse-trucks') {
      const urlParams = new URLSearchParams(window.location.search)
      const searchParam = urlParams.get('search')
      if (searchParam !== null) {
        setSearchQuery(searchParam)
      } else {
        // Clear search if URL param is removed
        setSearchQuery('')
      }
    }
  }, [pathname])

  return (
    <nav className="navbar" style={{ padding: navbarPadding }}>
      <div className="nav-container">
        <Link href="/" className="nav-logo">
          <Image src="/logo.png" alt="Axlerator Logo" width={180} height={45} priority />
        </Link>
        
        {/* Search Bar */}
        <form className="nav-search" ref={searchRef} onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Search trucks, services..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setShowSuggestions(true)}
            className="search-input"
          />
          <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>
          
          {showSuggestions && searchQuery && filteredSuggestions.length > 0 && (
            <ul className="search-suggestions">
              {filteredSuggestions.map((suggestion, index) => (
                <li
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="search-suggestion-item"
                >
                  <svg className="suggestion-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </form>

        <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          {/* Buy Trucks - with dropdown */}
          <li 
            className="nav-item dropdown"
            onMouseEnter={() => handleMouseEnter('buy-trucks')}
            onMouseLeave={handleMouseLeave}
          >
            <a 
              href="/browse-trucks" 
              className={`nav-link ${activeSection === 'buy-trucks' ? 'active' : ''} ${openDropdown === 'buy-trucks' ? 'dropdown-open' : ''}`}
              onClick={(e) => handleDropdownClick(e, 'buy-trucks')}
            >
              Buy Trucks
              <span className="dropdown-arrow">▼</span>
            </a>
            <div className={`dropdown-menu dropdown-two-column ${openDropdown === 'buy-trucks' ? 'show' : ''}`}>
              <ul className="dropdown-column">
                <li><a href="/browse-trucks" className="dropdown-highlight">View all trucks <span className="dropdown-arrow-icon">→</span></a></li>
                <li><a href="/browse-trucks?location=mumbai">Used trucks in Mumbai <span className="dropdown-arrow-icon">→</span></a></li>
                <li><a href="/browse-trucks?location=delhi">Used trucks in Delhi <span className="dropdown-arrow-icon">→</span></a></li>
                <li><a href="/browse-trucks?location=delhi-ncr">Used trucks in Delhi NCR <span className="dropdown-arrow-icon">→</span></a></li>
                <li><a href="/browse-trucks?location=gurugram">Used trucks in Gurugram <span className="dropdown-arrow-icon">→</span></a></li>
                <li><a href="/browse-trucks?location=kanpur">Used trucks in Kanpur <span className="dropdown-arrow-icon">→</span></a></li>
              </ul>
              <ul className="dropdown-column">
                <li><a href="/browse-trucks?location=lucknow">Used trucks in Lucknow <span className="dropdown-arrow-icon">→</span></a></li>
                <li><a href="/browse-trucks?location=chandigarh">Used trucks in Chandigarh <span className="dropdown-arrow-icon">→</span></a></li>
                <li><a href="/browse-trucks?location=pune">Used trucks in Pune <span className="dropdown-arrow-icon">→</span></a></li>
                <li><a href="/browse-trucks?location=kolkata">Used trucks in Kolkata <span className="dropdown-arrow-icon">→</span></a></li>
                <li><a href="/browse-trucks?location=ahmedabad">Used trucks in Ahmedabad <span className="dropdown-arrow-icon">→</span></a></li>
              </ul>
            </div>
          </li>

          {/* Sell Your Truck - with dropdown */}
          <li 
            className={`nav-item ${SHOW_SELL_LOCATION_LINKS ? 'dropdown' : ''}`}
            onMouseEnter={() => handleMouseEnter('sell-truck')}
            onMouseLeave={handleMouseLeave}
          >
            {SHOW_SELL_LOCATION_LINKS ? (
              <a 
                href="/sell-truck" 
                className={`nav-link ${activeSection === 'sell-truck' ? 'active' : ''} ${openDropdown === 'sell-truck' ? 'dropdown-open' : ''}`}
                onClick={(e) => handleDropdownClick(e, 'sell-truck')}
              >
                Sell Your Truck
                <span className="dropdown-arrow">▼</span>
              </a>
            ) : (
              <Link 
                href="/sell-truck" 
                className={`nav-link ${activeSection === 'sell-truck' ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Sell Your Truck
              </Link>
            )}
            {SHOW_SELL_LOCATION_LINKS && (
              <div className={`dropdown-menu dropdown-two-column ${openDropdown === 'sell-truck' ? 'show' : ''}`}>
                <ul className="dropdown-column">
                  <li><a href="/sell-truck" className="dropdown-highlight">View all locations <span className="dropdown-arrow-icon">→</span></a></li>
                  <li><a href="/sell-truck?location=mumbai">Sell truck in Mumbai <span className="dropdown-arrow-icon">→</span></a></li>
                  <li><a href="/sell-truck?location=delhi">Sell truck in Delhi <span className="dropdown-arrow-icon">→</span></a></li>
                  <li><a href="/sell-truck?location=delhi-ncr">Sell truck in Delhi NCR <span className="dropdown-arrow-icon">→</span></a></li>
                  <li><a href="/sell-truck?location=gurugram">Sell truck in Gurugram <span className="dropdown-arrow-icon">→</span></a></li>
                  <li><a href="/sell-truck?location=kanpur">Sell truck in Kanpur <span className="dropdown-arrow-icon">→</span></a></li>
                </ul>
                <ul className="dropdown-column">
                  <li><a href="/sell-truck?location=lucknow">Sell truck in Lucknow <span className="dropdown-arrow-icon">→</span></a></li>
                  <li><a href="/sell-truck?location=chandigarh">Sell truck in Chandigarh <span className="dropdown-arrow-icon">→</span></a></li>
                  <li><a href="/sell-truck?location=pune">Sell truck in Pune <span className="dropdown-arrow-icon">→</span></a></li>
                  <li><a href="/sell-truck?location=kolkata">Sell truck in Kolkata <span className="dropdown-arrow-icon">→</span></a></li>
                  <li><a href="/sell-truck?location=ahmedabad">Sell truck in Ahmedabad <span className="dropdown-arrow-icon">→</span></a></li>
                </ul>
              </div>
            )}
          </li>

          {/* About Us - simple link */}
          <li className="nav-item">
            <Link 
              href="/about" 
              className={`nav-link ${pathname === '/about' ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              About Us
            </Link>
          </li>

          {/* Our Services - simple link */}
          <li className="nav-item">
            <a 
              href="/services" 
              className={`nav-link ${activeSection === 'services' ? 'active' : ''}`}
            >
              Our Services
            </a>
          </li>

          {/* Get Started - CTA button */}
          <li className="nav-item">
            <a 
              href="/sell-truck" 
              className="nav-link contact-btn"
            >
              Get Started
            </a>
          </li>
        </ul>
        <div 
          className={`hamburger ${isMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>
    </nav>
  )
}
