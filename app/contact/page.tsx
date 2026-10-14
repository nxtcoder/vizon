import type { Metadata } from 'next'
import { Phone, Mail, MapPin, ArrowRight } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ContactForm from './ContactForm'
import './contact.css'

export const metadata: Metadata = {
  title: 'Contact Us - Axlerator',
  description:
    'Talk to the Axlerator team about buying or selling a commercial vehicle, or becoming a channel partner. Call, email or visit our Rohini office in New Delhi.',
}

const phones = [
  { label: '+91 93107 74522', href: 'tel:+919310774522' },
  { label: '+91 91403 47833', href: 'tel:+919140347833' },
]

const emails = [
  { name: 'Ankur Kumar', address: 'ankur.kumar@axlerator.co.in' },
  { name: 'Raunak Chaudhary', address: 'raunakchaudhary@axlerator.co.in' },
]

const directionsUrl = 'https://www.google.com/maps/search/?api=1&query=Rohini+Sector+16+New+Delhi'
const mapEmbedUrl = 'https://www.google.com/maps?q=Rohini+Sector+16+New+Delhi&output=embed'

export default function ContactPage() {
  return (
    <div className="ct-page">
      <Navbar />

      <section className="ct-hero">
        <div className="ct-container">
          <span className="ct-kicker">Contact Us</span>
          <h1 className="ct-hero-title">Let&apos;s talk about your fleet.</h1>
          <p className="ct-hero-sub">
            Looking for a verified truck, want to sell yours, or interested in becoming a channel partner?
            Reach the Axlerator team directly or send us an inquiry.
          </p>
        </div>
      </section>

      <section className="ct-section">
        <div className="ct-container ct-split">
          <div>
            <h2 className="ct-subhead">Reach us directly</h2>
            <p className="ct-intro">Prefer to talk? Call, email or visit our office in Rohini.</p>

            <ul className="ct-channels">
              <li className="ct-card">
                <span className="ct-card-icon ct-tone-navy" aria-hidden="true">
                  <Phone size={22} />
                </span>
                <div>
                  <h3>Call us</h3>
                  {phones.map((phone) => (
                    <a key={phone.href} href={phone.href} className="ct-line">
                      {phone.label}
                    </a>
                  ))}
                </div>
              </li>

              <li className="ct-card">
                <span className="ct-card-icon ct-tone-red" aria-hidden="true">
                  <Mail size={22} />
                </span>
                <div>
                  <h3>Email us</h3>
                  {emails.map((person) => (
                    <div key={person.address} className="ct-person">
                      <span className="ct-person-name">{person.name}</span>
                      <a href={`mailto:${person.address}`} className="ct-line">
                        {person.address}
                      </a>
                    </div>
                  ))}
                </div>
              </li>

              <li className="ct-card">
                <span className="ct-card-icon ct-tone-gold" aria-hidden="true">
                  <MapPin size={22} />
                </span>
                <div>
                  <h3>Visit us</h3>
                  <p className="ct-line">
                    Rohini Sector-16
                    <br />
                    New Delhi
                  </p>
                  <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="ct-directions">
                    Get directions
                    <ArrowRight size={16} aria-hidden="true" />
                  </a>
                </div>
              </li>
            </ul>
          </div>

          <ContactForm />
        </div>
      </section>

      <section className="ct-map-section">
        <div className="ct-container">
          <div className="ct-map-head">
            <span className="ct-tag">Location</span>
            <h2 className="ct-subhead">Find our office</h2>
          </div>
          <div className="ct-map">
            <iframe
              title="Map of the Axlerator office in Rohini Sector-16, New Delhi"
              src={mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
