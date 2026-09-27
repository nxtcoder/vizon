'use client'

import React from 'react'
import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer-section">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-grid">
          {/* Column 1 - Our Services */}
          <div className="footer-column">
            <h3 className="footer-heading">Our Services</h3>
            <ul className="footer-links">
              <li>
                <Link href="#certified-trucks" className="footer-link">
                  Buy a Certified Truck
                </Link>
              </li>
              <li>
                <Link href="#sell" className="footer-link">
                  Sell Your Truck
                </Link>
              </li>
              <li>
                <Link href="#inspection" className="footer-link">
                  200-Point Inspection
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2 - Quick Links */}
          <div className="footer-column">
            <h3 className="footer-heading">Quick Links</h3>
            <ul className="footer-links">
              <li>
                <Link href="#about" className="footer-link">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#contact" className="footer-link">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="#privacy" className="footer-link">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#terms" className="footer-link">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="#blog" className="footer-link">
                  Blog/Articles
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 - Contact Us */}
          <div className="footer-column">
            <h3 className="footer-heading">Contact Us</h3>
            <ul className="footer-contact">
              <li className="footer-contact-item">
                <svg 
                  className="footer-contact-icon" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
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
                <span>Rohini, New Delhi</span>
              </li>
              <li className="footer-contact-item">
                <svg 
                  className="footer-contact-icon" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" 
                  />
                </svg>
                <a href="tel:+9191403478733" className="footer-link">
                  +91 91403 47873
                </a>
              </li>
              <li className="footer-contact-item">
                <svg 
                  className="footer-contact-icon" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                  />
                </svg>
                <a href="mailto:ankur.kumar@axlerator.co.in" className="footer-link">
                  ankur.kumar@axlerator.co.in
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4 - Follow Us */}
          <div className="footer-column">
            <h3 className="footer-heading">Follow Us</h3>
            <div className="footer-social">
              <a 
                href="https://www.linkedin.com/company/axlerator/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="LinkedIn"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="Facebook"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                </svg>
              </a>
              <a 
                href="https://www.instagram.com/axlerator_india?stkn=b3F5MHBkN283d2Ri" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="Instagram"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
            <div className="footer-trust-badge">
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                className="trust-badge-icon"
              >
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
              </svg>
              <span>Secure & Trusted</span>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {currentYear} Axlerator. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
