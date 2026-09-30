import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, ShieldCheck, Zap, Handshake } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import './about.css'

export const metadata: Metadata = {
  title: 'About Us - Axlerator',
  description:
    "India's most trusted digital marketplace for commercial vehicles. Every truck carries the Axlerator Trust Seal: technical inspection, legal background check and a 1-10 condition rating.",
}

const metrics = [
  { value: '50+', label: 'Verified Inventory' },
  { value: '7', label: 'Official Dealer Partners' },
  { value: '8', label: 'Official Logistics Partners' },
  { value: 'Delhi & NCR', label: 'Serving Delhi & Delhi NCR' },
]

const journey = [
  {
    title: 'The Beginning',
    text: 'Identified the core fragmentation and lack of trust in the second-hand commercial vehicle market.',
  },
  {
    title: 'Developing the Trust Seal',
    text: 'Engineered our rigorous multi-point technical inspection and legal verification protocol.',
  },
  {
    title: 'Expanding the Ecosystem',
    text: 'Launched operations as an agile aggregator, proving the market demand for verified, 1-10 condition-rated inventory.',
  },
  {
    title: 'Regional Dominance',
    text: 'Scaled our operational footprint to establish comprehensive coverage and rapid fulfillment across the critical Delhi and Delhi NCR logistics corridors.',
  },
  {
    title: 'The Future',
    text: 'Scaling our dynamic bidding platform and expanding our robust digital network of official channel partners nationwide.',
  },
]

const pillars = [
  {
    title: 'Axlerator Digital',
    text: 'The premier online marketplace for buying and selling verified commercial vehicles with complete transparency.',
  },
  {
    title: 'Axlerator Partner Network',
    text: 'Our exclusive, vetted alliance of top-tier logistics companies and official dealer partners, guaranteeing high-quality supply and immediate demand matching.',
  },
  {
    title: 'Axlerator Trust Seal',
    text: 'Our proprietary inspection division handling mechanical scoring, 1-10 condition ratings, and comprehensive legal background checks.',
  },
]

// BharatBenz has no logo file yet, so it renders as a wordmark.
// scale offsets the empty padding baked into each SVG's viewBox.
const partners: { name: string; logo?: string; scale?: number }[] = [
  { name: 'Tata Motors', logo: '/logos/TataMotors.svg', scale: 2.6 },
  { name: 'Eicher', logo: '/logos/EicherMotors.svg', scale: 1.2 },
  { name: 'Ashok Leyland', logo: '/logos/AshokLeyland.svg', scale: 2 },
  { name: 'Mahindra', logo: '/logos/Mahindra.svg', scale: 1.8 },
  { name: 'BharatBenz' },
]

const founders = [
  {
    name: 'Ankur',
    role: 'Co-Founder',
    photo: '/team/ankur.jpg',
    bio: 'Driving the strategic vision and operational execution, Ankur focuses on scaling Axlerator’s market footprint. He is the architect behind Axlerator’s robust network of official dealer and logistics channel partners, ensuring seamless supply chain integration and rapid expansion across the Delhi NCR region and beyond.',
  },
  {
    name: 'Raunak',
    role: 'Co-Founder',
    photo: '/team/raunak.jpg',
    bio: 'Spearheading the technology, product, and verification ecosystem, Raunak ensures the Axlerator Trust Seal is backed by unyielding data and a frictionless digital platform. His focus is on translating complex mechanical and legal data into intuitive, actionable insights that empower fleet owners to make profitable decisions.',
  },
]

const values = [
  { title: 'Transparency', text: 'We hide nothing. Every mechanical and legal detail is exposed.', Icon: Eye },
  { title: 'Rigor', text: 'Our inspection standards are unyielding and exhaustive.', Icon: ShieldCheck },
  { title: 'Agility', text: 'We move fast to adapt to the shifting demands of the logistics sector.', Icon: Zap },
  { title: 'Partnership', text: 'We treat every fleet owner’s investment as if it were our own.', Icon: Handshake },
]

const legalChecks = ['RC & ownership', 'Hypothecation', 'Challans', 'Insurance', 'Blacklist status']

function TrustSeal({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" role="img" aria-label="Axlerator Trust Seal">
      <defs>
        <path id="ab-seal-ring" d="M100 100 m-72 0 a72 72 0 1 1 144 0 a72 72 0 1 1 -144 0" />
      </defs>
      <circle cx="100" cy="100" r="94" fill="none" stroke="#EAA927" strokeWidth="3" />
      <circle cx="100" cy="100" r="86" fill="#030303" fillOpacity="0.75" stroke="#EAA927" strokeWidth="1" strokeDasharray="2 4" />
      <text fill="#EAA927" fontSize="13" fontWeight="600" letterSpacing="3.2">
        <textPath href="#ab-seal-ring">AXLERATOR • TRUST SEAL • VERIFIED •</textPath>
      </text>
      <circle cx="100" cy="100" r="48" fill="#EAA927" />
      <path d="M78 101 l15 15 l30 -32" fill="none" stroke="#030303" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function InspectionGraphic() {
  return (
    <div className="ab-inspect" aria-label="Axlerator Trust Seal inspection: technical inspection, 1-10 condition rating and legal background check">
      <div className="ab-inspect-rating">
        <span className="ab-inspect-kicker">Condition Rating</span>
        <div className="ab-inspect-scale">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className={i < 8 ? 'is-on' : ''}>{i + 1}</span>
          ))}
        </div>
      </div>

      <svg className="ab-inspect-truck" viewBox="0 0 420 200" aria-hidden="true">
        <g fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinejoin="round">
          {/* cargo body */}
          <rect x="20" y="30" width="240" height="110" rx="4" />
          <path d="M40 30v110M80 30v110M120 30v110M160 30v110M200 30v110M240 30v110" stroke="rgba(255,255,255,0.12)" />
          {/* cab */}
          <path d="M268 60h70l42 42v38H268z" />
          <path d="M290 72h44l30 30h-74z" stroke="rgba(255,255,255,0.35)" />
          {/* chassis */}
          <path d="M20 148h380" />
          {/* wheels */}
          <circle cx="80" cy="160" r="22" />
          <circle cx="80" cy="160" r="8" />
          <circle cx="140" cy="160" r="22" />
          <circle cx="140" cy="160" r="8" />
          <circle cx="330" cy="160" r="22" />
          <circle cx="330" cy="160" r="8" />
        </g>
        {/* engine block under the cab */}
        <rect x="300" y="112" width="56" height="26" rx="3" fill="rgba(234,169,39,0.12)" stroke="#EAA927" strokeWidth="1.5" strokeDasharray="4 3" />
        {/* inspection nodes */}
        {[
          [328, 125],
          [80, 160],
          [330, 160],
          [372, 110],
          [140, 160],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="11" fill="rgba(234,169,39,0.18)" className="ab-node-pulse" />
            <circle cx={cx} cy={cy} r="4.5" fill="#EAA927" />
          </g>
        ))}
        <path d="M328 125 L328 20 L300 20" stroke="#EAA927" strokeWidth="1" fill="none" />
        <text x="296" y="24" fill="#EAA927" fontSize="11" fontWeight="600" textAnchor="end" letterSpacing="1">
          TECHNICAL INSPECTION
        </text>
      </svg>

      <ul className="ab-inspect-legal">
        <li className="ab-inspect-kicker">Legal Background Check</li>
        {legalChecks.map((item) => (
          <li key={item}>
            <ShieldCheck size={16} aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function AboutPage() {
  return (
    <div className="about-page">
      <Navbar />

      {/* Hero */}
      <section className="ab-hero">
        <Image src="/heroimage2.png" alt="" fill priority sizes="100vw" className="ab-hero-bg" />
        <div className="ab-hero-shade" />
        <div className="ab-hero-inner">
          <TrustSeal className="ab-hero-seal" />
          <h1 className="ab-hero-title">
            India&apos;s Most Trusted Digital Marketplace for Commercial Vehicles.
          </h1>
          <p className="ab-hero-sub">
            We don&apos;t just sell second-hand trucks. We sell data-driven trust, rigorous verification,
            and peace of mind for fleet owners and independent drivers. Welcome to the new standard for
            commercial mobility.
          </p>
        </div>
      </section>

      {/* Problem & disruption */}
      <section className="ab-section">
        <div className="ab-container ab-split">
          <div className="ab-split-copy">
            <h2 className="ab-subhead ab-red">The Broken Market</h2>
            <p>
              Buying a second-hand commercial vehicle has traditionally been a gamble. The market is
              fragmented, pricing is unpredictable, and critical red flags are often hidden. For buyers,
              the stakes are simply too high for guesswork.
            </p>
            <h2 className="ab-subhead ab-gold">The Axlerator Disruption</h2>
            <p>
              We eliminated the guesswork with the <strong>Axlerator Trust Seal</strong>. Every vehicle
              undergoes a grueling multi-point technical inspection and comprehensive legal background
              check. We distill complex vehicle data into a transparent{' '}
              <strong>1-10 Condition Rating</strong>. No hidden flaws. No legal blind spots. Just verified
              assets ready to work.
            </p>
          </div>
          <InspectionGraphic />
        </div>
      </section>

      {/* Impact metrics */}
      <section className="ab-band">
        <div className="ab-container">
          <h2 className="ab-title">Impact in Numbers</h2>
          <div className="ab-metrics">
            {metrics.map((m) => (
              <div key={m.label} className="ab-metric">
                <span className="ab-metric-value">{m.value}</span>
                <span className="ab-metric-label">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey */}
      <section className="ab-section">
        <div className="ab-container">
          <h2 className="ab-title">Our Journey</h2>
          <ol className="ab-timeline">
            {journey.map((step, i) => (
              <li key={step.title} className="ab-timeline-item">
                <div className="ab-timeline-card">
                  <span className="ab-timeline-step">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Engine & ecosystem */}
      <section className="ab-section ab-section-tight">
        <div className="ab-container">
          <h2 className="ab-title">The Engine &amp; Ecosystem</h2>
          <div className="ab-pillars">
            {pillars.map((p) => (
              <article key={p.title} className="ab-pillar">
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="ab-partners" aria-label="OEM partner brands">
          <div className="ab-partners-track">
            {[...partners, ...partners].map((p, i) => (
              <div key={i} className="ab-partner" aria-hidden={i >= partners.length}>
                {p.logo ? (
                  <Image
                    src={p.logo}
                    alt={p.name}
                    width={140}
                    height={48}
                    className="ab-partner-logo"
                    style={{ transform: `scale(${p.scale ?? 1})` }}
                  />
                ) : (
                  <span className="ab-partner-word">{p.name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership & values */}
      <section className="ab-section">
        <div className="ab-container">
          <h2 className="ab-title">Leadership Team</h2>
          <div className="ab-founders">
            {founders.map((f) => (
              <div key={f.name} className="ab-founder">
                <div className="ab-founder-photo">
                  <Image src={f.photo} alt={`${f.name}, ${f.role}`} width={180} height={180} />
                </div>
                <h3>{f.name}</h3>
                <span className="ab-founder-role">{f.role}</span>
                <p>{f.bio}</p>
              </div>
            ))}
          </div>

          <h2 className="ab-title ab-values-title">Core Values</h2>
          <div className="ab-values">
            {values.map(({ title, text, Icon }) => (
              <div key={title} className="ab-value">
                <div className="ab-value-icon">
                  <Icon size={28} aria-hidden="true" />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="ab-cta">
        <div className="ab-container">
          <h2>
            Ready to upgrade your fleet?
            <br />
            Stop guessing and start driving.
          </h2>
          <div className="ab-cta-buttons">
            <Link href="/browse-trucks" className="ab-btn">
              Browse Verified Inventory
            </Link>
            <Link href="/#contact" className="ab-btn">
              Become a Channel Partner
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
