'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function AboutUs() {
  return (
    <section className="about-us-section" id="about-us">
      <div className="about-us-container">
        <div className="about-us-content">
          {/* Left Side - Image */}
          <div className="about-us-image">
            <Image
              src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop"
              alt="Axlerator Team"
              fill
              style={{ objectFit: 'cover' }}
              className="about-us-img"
            />
          </div>

          {/* Right Side - Content */}
          <div className="about-us-text">
            <h2 className="about-us-heading">
              Redefining Trust in Commercial Vehicle Transactions
            </h2>

            <p className="about-us-description">
              At Axlerator, we are orchestrating a paradigm shift in the commercial vehicle marketplace.
              By combining cutting-edge technology with unparalleled industry expertise, we&apos;ve created a
              platform that brings transparency, efficiency, and confidence to every transaction. Our mission
              is to empower businesses with the tools and insights they need to make informed decisions about
              their fleet investments.
            </p>

            <p className="about-us-description">
              We don&apos;t just sell trucks; we deliver certainty for your business. Every vehicle on our platform
              undergoes rigorous multi-point inspections, comprehensive documentation verification, and detailed
              performance assessments. With Axlerator, you&apos;re not just buying a truck—you&apos;re investing in a
              partnership built on trust, backed by our commitment to excellence, and supported by a team that
              understands the critical role commercial vehicles play in your success.
            </p>

            <Link href="/about" className="about-us-cta">
              Learn More About Us
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
