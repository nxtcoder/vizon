import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  Eye,
  ShieldCheck,
  Zap,
  Handshake,
  Truck,
  Store,
  Route,
  MapPin,
  Search,
  Network,
  Rocket,
  MonitorSmartphone,
  BadgeCheck,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import './about.css'

export const metadata: Metadata = {
  title: 'About Us - Axlerator',
  description:
    "India's most trusted digital marketplace for commercial vehicles. Every truck carries the Axlerator Trust Seal: technical inspection, legal background check and a 1-10 condition rating.",
}

const metrics = [
  { value: '50+', label: 'Verified Inventory', Icon: Truck },
  { value: '7', label: 'Official Dealer Partners', Icon: Store },
  { value: '8', label: 'Official Logistics Partners', Icon: Route },
  { value: 'Delhi NCR', label: 'Serving Delhi & Delhi NCR', Icon: MapPin },
]

const journey = [
  {
    Icon: Search,
    period: 'Q1 2025',
    title: 'The Beginning',
    text: 'Identified the core fragmentation and lack of trust in the second-hand commercial vehicle market.',
  },
  {
    Icon: ShieldCheck,
    period: 'Q3 2025',
    title: 'Developing the Trust Seal',
    text: 'Engineered our rigorous multi-point technical inspection and legal verification protocol.',
  },
  {
    Icon: Network,
    period: 'Q1 2026',
    title: 'Expanding the Ecosystem',
    text: 'Launched operations as an agile aggregator, proving the market demand for verified, 1-10 condition-rated inventory.',
  },
  {
    Icon: MapPin,
    period: 'Q3 2026',
    title: 'Regional Dominance',
    text: 'Scaled our operational footprint to establish comprehensive coverage and rapid fulfillment across the critical Delhi and Delhi NCR logistics corridors.',
  },
  {
    Icon: Rocket,
    period: 'Q1 2027',
    title: 'The Future',
    text: 'Scaling our dynamic bidding platform and expanding our robust digital network of official channel partners nationwide.',
  },
]

const pillars = [
  {
    Icon: MonitorSmartphone,
    tone: 'navy',
    title: 'Axlerator Digital',
    text: 'The premier online marketplace for buying and selling verified commercial vehicles with complete transparency.',
  },
  {
    Icon: Handshake,
    tone: 'red',
    title: 'Axlerator Partner Network',
    text: 'Our exclusive, vetted alliance of top-tier logistics companies and official dealer partners, guaranteeing high-quality supply and immediate demand matching.',
  },
  {
    Icon: BadgeCheck,
    tone: 'gold',
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

// Five logos are narrower than a wide screen, so each group repeats them
// enough times to always overflow the viewport.
const partnerLoop = [...partners, ...partners, ...partners]

const founders = [
  {
    name: 'Ankur',
    role: 'Co-Founder',
    photo: '/team/ankur.jpg',
    linkedin: 'https://www.linkedin.com/in/ankur-kumar-6110761a0/',
    bio: 'Driving the strategic vision and operational execution, Ankur focuses on scaling Axlerator’s market footprint. He is the architect behind Axlerator’s robust network of official dealer and logistics channel partners, ensuring seamless supply chain integration and rapid expansion across the Delhi NCR region and beyond.',
  },
  {
    name: 'Raunak',
    role: 'Co-Founder',
    photo: '/team/raunak.jpg',
    linkedin: 'https://www.linkedin.com/in/raunak-chaudhary-01158a201/',
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

// same mark as the footer's LinkedIn link
function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  )
}

function SectionHead({ tag, title }: { tag: string; title: string }) {
  return (
    <div className="ab-head">
      <span className="ab-tag">{tag}</span>
      <h2 className="ab-title">{title}</h2>
    </div>
  )
}

function TrustSeal({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" role="img" aria-label="Axlerator Trust Seal">
      <defs>
        <path id="ab-seal-ring" d="M100 100 m-72 0 a72 72 0 1 1 144 0 a72 72 0 1 1 -144 0" />
      </defs>
      <circle cx="100" cy="100" r="94" fill="none" stroke="#EAA927" strokeWidth="3" />
      <circle cx="100" cy="100" r="86" fill="#FFFFFF" stroke="#EAA927" strokeWidth="1" strokeDasharray="2 4" />
      <text fill="#A86F00" fontSize="13" fontWeight="600" letterSpacing="3.2">
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

      <svg className="ab-inspect-truck" viewBox="0 0 390 180" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeOpacity="0.7" strokeWidth="2" strokeLinejoin="round">
          {/* cargo body */}
          <rect x="20" y="28" width="236" height="104" rx="4" />
          <path d="M60 28v104M100 28v104M140 28v104M180 28v104M220 28v104" strokeOpacity="0.15" />
          {/* cab-over cab: tall, near-upright front with a rounded roof edge */}
          <path d="M264 40H334Q350 40 352 56L358 132H264Z" />
          {/* windscreen, door line, bumper */}
          <path d="M296 52H336Q343 52 344 60L347 88H296Z" strokeOpacity="0.4" />
          <path d="M290 94V130" strokeOpacity="0.3" />
          <path d="M354 120H366V132H356" />
          {/* chassis rail */}
          <path d="M20 138H366" />
        </g>
        {/* wheels sit just under the body; the solid fill hides the rail behind them */}
        <g fill="#ffffff" stroke="currentColor" strokeOpacity="0.7" strokeWidth="2">
          <circle cx="78" cy="153" r="20" />
          <circle cx="132" cy="153" r="20" />
          <circle cx="322" cy="153" r="20" />
        </g>
        <g fill="none" stroke="currentColor" strokeOpacity="0.7" strokeWidth="2">
          <circle cx="78" cy="153" r="7" />
          <circle cx="132" cy="153" r="7" />
          <circle cx="322" cy="153" r="7" />
        </g>
        {/* headlamp */}
        <rect x="347" y="100" width="8" height="8" rx="2" fill="currentColor" fillOpacity="0.35" />
        {/* engine block under the cab */}
        <rect x="296" y="98" width="48" height="28" rx="3" fill="rgba(234,169,39,0.12)" stroke="#EAA927" strokeWidth="1.5" strokeDasharray="4 3" />
        {/* inspection nodes: engine, wheel hubs, headlamp */}
        {[
          [320, 112],
          [78, 153],
          [132, 153],
          [322, 153],
          [351, 104],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="11" fill="rgba(234,169,39,0.18)" className="ab-node-pulse" />
            <circle cx={cx} cy={cy} r="4.5" fill="#EAA927" />
          </g>
        ))}
        <path d="M320 112 L320 18 L292 18" stroke="#EAA927" strokeWidth="1" fill="none" />
        <text x="288" y="22" fill="#A86F00" fontSize="11" fontWeight="600" textAnchor="end" letterSpacing="1">
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
        <div className="ab-hero-bg">
          <Image src="/about-hero.jpg" alt="Commercial truck on the road" fill priority sizes="100vw" />
        </div>
        <div className="ab-hero-fade" />
        <TrustSeal className="ab-hero-seal" />
        <div className="ab-container ab-hero-copy">
          <span className="ab-hero-kicker">About Axlerator</span>
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
            <span className="ab-tag ab-tag-red">Who we are</span>
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
      <section className="ab-section ab-tint">
        <div className="ab-container">
          <SectionHead tag="Scale & trust" title="Impact in Numbers" />
          <div className="ab-metrics">
            {metrics.map(({ value, label, Icon }) => (
              <div key={label} className="ab-metric">
                <span className="ab-metric-icon">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <span className="ab-metric-value">{value}</span>
                <span className="ab-metric-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey */}
      <section className="ab-section">
        <div className="ab-container">
          <SectionHead tag="Milestones" title="Our Journey" />
          <ol className="ab-timeline">
            {journey.map(({ Icon, ...step }) => (
              <li key={step.title} className="ab-timeline-item">
                <span className="ab-timeline-node" aria-hidden="true">
                  <Icon size={20} />
                </span>
                <div className="ab-timeline-card">
                  <span className="ab-timeline-step">{step.period}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Engine & ecosystem */}
      <section className="ab-section ab-band">
        <div className="ab-container">
          <SectionHead tag="The ecosystem" title="The Engine & Ecosystem" />
          <div className="ab-pillars">
            {pillars.map(({ Icon, tone, title, text }) => (
              <article key={title} className="ab-pillar">
                <div className="ab-pillar-head">
                  <span className={`ab-pillar-icon ab-tone-${tone}`}>
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <h3>{title}</h3>
                </div>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Partner brands */}
      <section className="ab-section ab-tint ab-section-tight">
        <div className="ab-container">
          <SectionHead tag="Trusted by" title="OEM Partner Brands" />
        </div>
        <div className="ab-partners" aria-label="OEM partner brands">
          <div className="ab-partners-track">
            {/* two identical groups: the track slides by exactly one group, then loops */}
            {[0, 1].map((group) => (
              <div key={group} className="ab-partners-group" aria-hidden={group === 1}>
                {partnerLoop.map((p, i) => (
                  <div key={i} className="ab-partner">
                    {p.logo ? (
                      <Image
                        src={p.logo}
                        alt={group === 0 && i < partners.length ? p.name : ''}
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
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="ab-section">
        <div className="ab-container">
          <SectionHead tag="Leadership" title="Leadership Team" />
          <div className="ab-founders">
            {founders.map((f) => (
              <div key={f.name} className="ab-founder">
                <div className="ab-founder-photo">
                  <Image src={f.photo} alt={`${f.name}, ${f.role}`} width={220} height={220} />
                </div>
                <h3>{f.name}</h3>
                <span className="ab-founder-role">{f.role}</span>
                <a
                  href={f.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ab-founder-linkedin"
                  aria-label={`${f.name} on LinkedIn`}
                >
                  <LinkedInIcon />
                </a>
                <p>{f.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="ab-section ab-band">
        <div className="ab-container">
          <SectionHead tag="What drives us" title="Our Core Values" />
          <div className="ab-values">
            {/* dashed zigzag joining the staggered icons (desktop only) */}
            <svg className="ab-values-link" viewBox="0 0 100 160" preserveAspectRatio="none" aria-hidden="true">
              <polyline
                points="12.5,48 37.5,112 62.5,48 87.5,112"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="6 6"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {values.map(({ title, text, Icon }) => (
              <div key={title} className="ab-value">
                <div className="ab-value-icon">
                  <Icon size={34} aria-hidden="true" />
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
