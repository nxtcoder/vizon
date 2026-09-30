'use client'

export default function ContactUs() {
  const handleMapClick = () => {
    // Open Google Maps for Saybea Emerald, Bandra, Mumbai
    window.open(
      'https://www.google.com/maps/search/?api=1&query=Saybea+Emerald,+Bandra,+Mumbai',
      '_blank'
    )
  }

  return (
    <section className="contact-us-section" id="contact">
      <div className="contact-us-container">
        <div className="contact-us-header">
          <h2 className="contact-us-title">Let&apos;s collaborate</h2>
          <p className="contact-us-subtitle">
            Get in touch with us to find your perfect truck or list your vehicle
          </p>
        </div>

        <div className="contact-map-wrapper" onClick={handleMapClick}>
          <div className="map-overlay">
            <div className="map-overlay-content">
              <svg
                className="map-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="map-overlay-text">Click to view our location</p>
            </div>
          </div>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2432.7446876!2d-0.607!3d52.29!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTLCsDE3JzI0LjAiTiAwwrAzNicyNS4yIlc!5e0!3m2!1sen!2suk!4v1234567890"
            width="100%"
            height="100%"
            style={{ border: 0, pointerEvents: 'none' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="contact-info-grid">
          <div className="contact-info-card">
            <div className="contact-info-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div className="contact-info-content">
              <h3>Phone</h3>
              <p>+91 91403478733</p>
            </div>
          </div>

          <div className="contact-info-card">
            <div className="contact-info-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="contact-info-content">
              <h3>Business Hours</h3>
              <p>Mon - Fri: 9:00 AM - 6:00 PM</p>
            </div>
          </div>

          <div className="contact-info-card">
            <div className="contact-info-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="contact-info-content">
              <h3>Visit Us</h3>
              <p>Saybea Emerald, Bandra, Mumbai</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
