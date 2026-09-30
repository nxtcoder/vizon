'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Image from 'next/image'

export default function ServicesPage() {
  return (
    <div className="services-page">
      <Navbar />
      
      <div className="services-container">
        {/* Mission Section */}
        <section className="mission-section">
          <div className="mission-content">
            <h1 className="mission-title">Our Mission</h1>
            <p className="mission-description">
              Our mission is to build India&apos;s most trusted platform for pre-owned commercial vehicles.
              We are here to eliminate uncertainty by controlling the entire vehicle journey from rigorous inspection and fair pricing to seamless financing and dedicated after-sales support. Through technology and integrity, we empower our customers to make confident decisions that keep their businesses moving forward.
            </p>
          </div>
        </section>

        {/* What Makes Us Different Section */}
        <section className="different-section">
          <div className="different-content">
            <h2 className="different-title">What Makes Us Different</h2>
            <p className="different-tagline">We&apos;ve replaced guesswork with guarantee.</p>
            <p className="different-description">
              Unlike conventional marketplaces, Axlerator directly acquires and certifies every vehicle through a proprietary 200+ point inspection covering mechanical, structural, electrical, and safety parameters. Each truck, van, or tipper comes with a detailed digital inspection report, transparent pricing, and the backing of our integrated finance and insurance solutions. From test drive to documentation, we own the experience so you can own with confidence.
            </p>
          </div>
        </section>

        {/* Logo with Process Flow Section */}
        <section className="logo-process-section">
          <div className="logo-process-container">
            <div className="logo-process-wrapper">
              {/* Source - Top */}
              <div className="process-word process-word-source">
                <span className="process-word-text">Source</span>
              </div>
              
              {/* Certify - Top Right */}
              <div className="process-word process-word-certify">
                <span className="process-word-text">Certify</span>
              </div>
              
              {/* Finance - Bottom Right */}
              <div className="process-word process-word-finance">
                <span className="process-word-text">Finance</span>
              </div>
              
              {/* Insure - Bottom Left */}
              <div className="process-word process-word-insure">
                <span className="process-word-text">Insure</span>
              </div>
              
              {/* Support - Top Left */}
              <div className="process-word process-word-support">
                <span className="process-word-text">Support</span>
              </div>
              
              {/* Logo in Center */}
              <div className="logo-center">
                <Image
                  src="/logo.png"
                  alt="Axlerator Logo"
                  width={200}
                  height={200}
                  className="logo-image"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Three Pillars Section */}
        <section className="pillars-section">
          <h2 className="pillars-title">Our Three Pillars</h2>
          <div className="pillars-grid">
            <div className="pillar-card">
              <div className="pillar-icon">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L15 8L22 9L17 14L18.5 21L12 18L5.5 21L7 14L2 9L9 8L12 2Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              <h3 className="pillar-title">Quality Assured</h3>
              <p className="pillar-description">
                Through rigorous certification with our proprietary 200+ point inspection process covering every aspect of the vehicle.
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              </div>
              <h3 className="pillar-title">Total Transparency</h3>
              <p className="pillar-description">
                In pricing and condition with detailed digital inspection reports and fair, upfront pricing for every vehicle.
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3 className="pillar-title">End-to-End Support</h3>
              <p className="pillar-description">
                With in-house financing, insurance, and service networks ensuring a seamless experience from purchase to ownership.
              </p>
            </div>
          </div>
          <p className="pillars-conclusion">
            At Axlerator, you don&apos;t just buy a vehicle—you invest in peace of mind.
          </p>
        </section>
      </div>

      <Footer />
    </div>
  )
}

