'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { publicTruckImagesRoot } from '@/lib/supabase-storage'

const TRUCK_IMAGES_BASE = publicTruckImagesRoot()

// Phone OTP before the full quality report. Off for now; the flow below is kept
// so it can be switched back on.
const REPORT_OTP_ENABLED = false

// Report links in `trucks` are Supabase public URLs; `?download=<name>` makes
// storage send the PDF as an attachment under that name.
const reportDownloadUrl = (url: string, fileName: string) => {
  const u = new URL(url)
  u.searchParams.set('download', fileName)
  return u.toString()
}

const isVideoUrl = (url?: string | null) => /\.(mp4|mov|webm)(\?|$)/i.test(url || '')

/** "…/58-cold-start.mp4" -> 58: the showcase position the form pipeline names each file with. */
// Two or three digits only: older uploads start with a 13-digit timestamp.
const showcaseNumber = (url: string) => Number(url.match(/\/(\d{2,3})-[^/]*$/)?.[1] ?? NaN)

/**
 * Form listings number every photo and video in showcase order (front, sides,
 * back, … engine videos, tyres), so they are merged by that number. Older
 * listings, whose files are not numbered, keep the order they are stored in.
 */
const sortByShowcaseNumber = (urls: string[]) =>
  urls.every((u) => Number.isFinite(showcaseNumber(u)))
    ? [...urls].sort((a, b) => showcaseNumber(a) - showcaseNumber(b))
    : urls

/**
 * trucks.payload_capacity_net/_gross are kg and payload_capacity_ft is feet.
 * Kg render as tonnes; anything that isn't a number renders as written.
 */
const formatLoadCapacity = (raw: unknown, unit: 'kg' | 'ft'): { text: string; tonnes: boolean } | null => {
  if (raw === null || raw === undefined) return null
  const s = String(raw).trim()
  if (!s) return null
  const digits = s.replace(/[^0-9.]/g, '')
  const n = Number(digits)
  if (digits && Number.isFinite(n) && n > 0) {
    return unit === 'kg' ? { text: (n / 1000).toFixed(2), tonnes: true } : { text: String(n), tonnes: false }
  }
  return { text: s, tonnes: false }
}

/** trucks.insurance_date is ISO (2027-09-13); show it the way the reports do (13.09.2027) */
const formatDbDate = (raw: unknown): string | null => {
  const m = String(raw ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[3]}.${m[2]}.${m[1]}` : null
}

/** 1 -> "1st", 2 -> "2nd"; null when the record has no ownership count */
const ownershipShort = (n?: number | null): string | null => {
  if (n === null || n === undefined) return null
  const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'
  return `${n}${suffix}`
}

// Function to get inspection data based on truck
const getInspectionData = (truckName: string | null | undefined) => {
  // Tata Ace Gold (7908) – inspection ratings from quality report
  const isTataAceGold = truckName === 'Tata Ace Gold (7908)' || (truckName?.includes?.('Tata Ace Gold') && truckName?.includes?.('7908'))
  if (isTataAceGold) {
    return {
      coreSystems: {
        score: 8,
        label: 'Core Systems',
        parts: 278,
        assemblies: 3,
        status: 'Very Good',
        items: [
          { name: 'Engine', score: 8, status: 'Good condition, minor wear', passed: true },
          { name: 'Transmission', score: 8, status: 'Functional, some wear', passed: true },
          { name: 'Drivetrain', score: 8, status: 'Good condition', passed: true },
        ]
      },
      loadingSystems: {
        score: 8,
        label: 'Loading Systems',
        parts: 156,
        assemblies: 2,
        status: 'Very Good',
        items: [
          { name: 'Cargo Bed', score: 8, status: 'Good condition', passed: true },
          { name: 'Tipping Mechanism', score: 7, status: 'Functional, some wear', passed: true },
        ]
      },
      cabinInteriors: {
        score: 7,
        label: 'Cabin & Interiors',
        parts: 124,
        assemblies: 4,
        status: 'Good',
        items: [
          { name: 'Seats & Upholstering', score: 7, status: 'Functional, some wear', passed: true },
          { name: 'Dashboard & Controls', score: 7, status: 'Functional, minor wear', passed: true },
        ]
      },
      exteriorBody: {
        score: 8,
        label: 'Exterior & Body',
        parts: 89,
        assemblies: 2,
        status: 'Very Good',
        items: [
          { name: 'Body Panels', score: 8, status: 'Good condition', passed: true },
          { name: 'Paint & Finish', score: 8, status: 'Good condition', passed: true },
          { name: 'Light & Mirrors', score: 8, status: 'Good condition', passed: true },
        ]
      },
      safetyBrakes: {
        score: 8,
        label: 'Safety & Brakes',
        parts: 67,
        assemblies: 2,
        status: 'Very Good',
        items: [
          { name: 'Brake System', score: 8, status: 'Good condition', passed: true },
          { name: 'ABS Module', score: 8, status: 'Fully functional', passed: true },
          { name: 'Safety Features', score: 8, status: 'Good condition', passed: true },
        ]
      },
    }
  }

  // Tata Ace Gold (plain – folder Tata Ace Gold-20260307T052504Z-1-001)
  const isTataAceGoldPlainInspection = truckName === 'Tata Ace Gold' && !truckName?.includes?.('7908')
  if (isTataAceGoldPlainInspection) {
    return {
      coreSystems: {
        score: 8,
        label: 'Core Systems',
        parts: 278,
        assemblies: 3,
        status: 'Very Good',
        items: [
          { name: 'Engine', score: 8, status: 'Good condition, minor wear', passed: true },
          { name: 'Transmission', score: 8, status: 'Functional, some wear', passed: true },
          { name: 'Drivetrain', score: 8, status: 'Good condition', passed: true },
        ]
      },
      loadingSystems: {
        score: 8,
        label: 'Loading Systems',
        parts: 156,
        assemblies: 2,
        status: 'Very Good',
        items: [
          { name: 'Cargo Bed', score: 8, status: 'Good condition', passed: true },
          { name: 'Tipping Mechanism', score: 7, status: 'Functional, some wear', passed: true },
        ]
      },
      cabinInteriors: {
        score: 8,
        label: 'Cabin & Interiors',
        parts: 124,
        assemblies: 4,
        status: 'Very Good',
        items: [
          { name: 'Seats & Upholstering', score: 8, status: 'Good condition', passed: true },
          { name: 'Dashboard & Controls', score: 8, status: 'Good condition', passed: true },
        ]
      },
      exteriorBody: {
        score: 8,
        label: 'Exterior & Body',
        parts: 89,
        assemblies: 2,
        status: 'Very Good',
        items: [
          { name: 'Body Panels', score: 8, status: 'Good condition', passed: true },
          { name: 'Paint & Finish', score: 7, status: 'Functional, minor wear', passed: true },
          { name: 'Light & Mirrors', score: 8, status: 'Good condition', passed: true },
        ]
      },
      safetyBrakes: {
        score: 8,
        label: 'Safety & Brakes',
        parts: 67,
        assemblies: 2,
        status: 'Very Good',
        items: [
          { name: 'Brake System', score: 8, status: 'Good condition', passed: true },
          { name: 'ABS Module', score: 8, status: 'Fully functional', passed: true },
          { name: 'Safety Features', score: 8, status: 'Good condition', passed: true },
        ]
      },
    }
  }

  // TATA 1512G LPT – inspection ratings from quality report
  const isTata1512G = truckName === 'TATA 1512G LPT' || truckName === 'Tata 1512G LPT' || (truckName?.includes?.('1512') && truckName?.includes?.('LPT') && truckName?.toLowerCase().includes?.('tata'))
  if (isTata1512G) {
    return {
      coreSystems: {
        score: 8,
        label: 'Core Systems',
        parts: 278,
        assemblies: 3,
        status: 'Very Good',
        items: [
          { name: 'Engine', score: 8, status: 'Good condition, minor wear', passed: true },
          { name: 'Transmission', score: 8, status: 'Functional, some wear', passed: true },
          { name: 'Drivetrain', score: 8, status: 'Good condition', passed: true },
        ]
      },
      loadingSystems: {
        score: 8,
        label: 'Loading Systems',
        parts: 156,
        assemblies: 2,
        status: 'Very Good',
        items: [
          { name: 'Cargo Bed', score: 8, status: 'Good condition', passed: true },
          { name: 'Tipping Mechanism', score: 7, status: 'Functional, some wear', passed: true },
        ]
      },
      cabinInteriors: {
        score: 8,
        label: 'Cabin & Interiors',
        parts: 124,
        assemblies: 4,
        status: 'Very Good',
        items: [
          { name: 'Seats & Upholstering', score: 7, status: 'Functional, some wear', passed: true },
          { name: 'Dashboard & Controls', score: 7, status: 'Functional, minor wear', passed: true },
        ]
      },
      exteriorBody: {
        score: 8,
        label: 'Exterior & Body',
        parts: 89,
        assemblies: 2,
        status: 'Very Good',
        items: [
          { name: 'Body Panels', score: 8, status: 'Good condition', passed: true },
          { name: 'Paint & Finish', score: 8, status: 'Good condition', passed: true },
          { name: 'Light & Mirrors', score: 7, status: 'Functional, minor wear', passed: true },
        ]
      },
      safetyBrakes: {
        score: 9,
        label: 'Safety & Brakes',
        parts: 67,
        assemblies: 2,
        status: 'Excellent',
        items: [
          { name: 'Brake System', score: 9, status: 'Excellent condition', passed: true },
          { name: 'ABS Module', score: 9, status: 'Fully functional', passed: true },
          { name: 'Safety Features', score: 8, status: 'Good condition', passed: true },
        ]
      },
    }
  }

  // SML Isuzu Samrat 4760gs specific inspection data
  if (truckName === 'SML Isuzu Samrat 4760gs') {
    return {
      coreSystems: {
        score: 8,
        label: 'Core Systems',
        parts: 278,
        assemblies: 3,
        status: 'Very Good',
        items: [
          { name: 'Engine', score: 8, status: 'Good condition, minor wear', passed: true },
          { name: 'Transmission', score: 8, status: 'Functional, some wear', passed: true },
          { name: 'Drivetrain', score: 9, status: 'Excellent condition', passed: true },
        ]
      },
      loadingSystems: {
        score: 8,
        label: 'Loading Systems',
        parts: 156,
        assemblies: 2,
        status: 'Very Good',
        items: [
          { name: 'Cargo Bed', score: 7, status: 'Functional, some wear', passed: true },
          { name: 'Tipping Mechanism', score: 7, status: 'Functional, some wear', passed: true },
        ]
      },
      cabinInteriors: {
        score: 8,
        label: 'Cabin & Interiors',
        parts: 124,
        assemblies: 4,
        status: 'Very Good',
        items: [
          { name: 'Seats & Upholstering', score: 9, status: 'Excellent condition', passed: true },
          { name: 'Dashboard & Controls', score: 8, status: 'Good condition', passed: true },
          { name: 'AC System', status: 'Operational', passed: true },
        ]
      },
      exteriorBody: {
        score: 8,
        label: 'Exterior & Body',
        parts: 89,
        assemblies: 2,
        status: 'Very Good',
        items: [
          { name: 'Body Panels', score: 8, status: 'Good condition', passed: true },
          { name: 'Paint & Finish', score: 7, status: 'Functional, minor wear', passed: true },
          { name: 'Light & Mirrors', score: 8, status: 'Good condition', passed: true },
        ]
      },
      safetyBrakes: {
        score: 9,
        label: 'Safety & Brakes',
        parts: 67,
        assemblies: 2,
        status: 'Excellent',
        items: [
          { name: 'Brake System', score: 9, status: 'Excellent condition', passed: true },
          { name: 'ABS Module', score: 9, status: 'Fully functional', passed: true },
          { name: 'Safety Features', score: 8, status: 'Good condition', passed: true },
        ]
      },
    }
  }
  
  // ASHOK LEYLAND ECOMET STAR 1415 HE specific inspection data
  if (truckName === 'ASHOK LEYLAND ECOMET STAR 1415 HE') {
    return {
      coreSystems: {
        score: 8,
        label: 'Core Systems',
        parts: 278,
        assemblies: 3,
        status: 'Very Good',
        items: [
          { name: 'Engine', score: 8, status: 'Good condition, minor wear', passed: true },
          { name: 'Transmission', score: 8, status: 'Functional, some wear', passed: true },
          { name: 'Drivetrain', score: 8, status: 'Good condition', passed: true },
        ]
      },
      loadingSystems: {
        score: 8,
        label: 'Loading Systems',
        parts: 156,
        assemblies: 2,
        status: 'Very Good',
        items: [
          { name: 'Cargo Bed', score: 8, status: 'Good condition', passed: true },
          { name: 'Tipping Mechanism', score: 7, status: 'Functional, some wear', passed: true },
        ]
      },
      cabinInteriors: {
        score: 8,
        label: 'Cabin & Interiors',
        parts: 124,
        assemblies: 4,
        status: 'Very Good',
        items: [
          { name: 'Seats & Upholstering', score: 8, status: 'Good condition', passed: true },
          { name: 'Dashboard & Controls', score: 7, status: 'Functional, minor wear', passed: true },
          { name: 'AC System', status: 'Operational', passed: true },
        ]
      },
      exteriorBody: {
        score: 8,
        label: 'Exterior & Body',
        parts: 89,
        assemblies: 2,
        status: 'Very Good',
        items: [
          { name: 'Body Panels', score: 8, status: 'Good condition', passed: true },
          { name: 'Paint & Finish', score: 8, status: 'Good condition', passed: true },
          { name: 'Light & Mirrors', score: 7, status: 'Functional, minor wear', passed: true },
        ]
      },
      safetyBrakes: {
        score: 9,
        label: 'Safety & Brakes',
        parts: 67,
        assemblies: 2,
        status: 'Excellent',
        items: [
          { name: 'Brake System', score: 9, status: 'Excellent condition', passed: true },
          { name: 'ABS Module', score: 9, status: 'Fully functional', passed: true },
          { name: 'Safety Features', score: 8, status: 'Good condition', passed: true },
        ]
      },
    }
  }
  
  // Mahindra Bolero Maxitruck Plus specific inspection data
  if (truckName === 'Mahindra Bolero Maxitruck Plus') {
    return {
      coreSystems: {
        score: 8,
        label: 'Core Systems',
        parts: 278,
        assemblies: 3,
        status: 'Very Good',
        items: [
          { name: 'Engine', score: 9, status: 'Excellent condition', passed: true },
          { name: 'Transmission', score: 8, status: 'Functional, some wear', passed: true },
          { name: 'Drivetrain', score: 8, status: 'Good condition', passed: true },
        ]
      },
      loadingSystems: {
        score: 8,
        label: 'Loading Systems',
        parts: 156,
        assemblies: 2,
        status: 'Very Good',
        items: [
          { name: 'Cargo Bed', score: 7, status: 'Functional, some wear', passed: true },
          { name: 'Tipping Mechanism', score: 7, status: 'Functional, some wear', passed: true },
        ]
      },
      cabinInteriors: {
        score: 8,
        label: 'Cabin & Interiors',
        parts: 124,
        assemblies: 4,
        status: 'Very Good',
        items: [
          { name: 'Seats & Upholstering', score: 8, status: 'Good condition', passed: true },
          { name: 'Dashboard & Controls', score: 8, status: 'Good condition', passed: true },
          { name: 'AC System', status: 'Operational', passed: true },
        ]
      },
      exteriorBody: {
        score: 8,
        label: 'Exterior & Body',
        parts: 89,
        assemblies: 2,
        status: 'Very Good',
        items: [
          { name: 'Body Panels', score: 8, status: 'Good condition', passed: true },
          { name: 'Paint & Finish', score: 7, status: 'Functional, minor wear', passed: true },
          { name: 'Light & Mirrors', score: 9, status: 'Excellent condition', passed: true },
        ]
      },
      safetyBrakes: {
        score: 9,
        label: 'Safety & Brakes',
        parts: 67,
        assemblies: 2,
        status: 'Excellent',
        items: [
          { name: 'Brake System', score: 9, status: 'Excellent condition', passed: true },
          { name: 'ABS Module', score: 9, status: 'Fully functional', passed: true },
          { name: 'Safety Features', score: 9, status: 'Excellent condition', passed: true },
        ]
      },
    }
  }
  
  // Tata 1412 LPT specific inspection data
  if (truckName === 'Tata 1412 LPT') {
    return {
      coreSystems: {
        score: 8,
        label: 'Core Systems',
        parts: 278,
        assemblies: 3,
        status: 'Very Good',
        items: [
          { name: 'Engine', score: 8, status: 'Good condition, minor wear', passed: true },
          { name: 'Transmission', score: 8, status: 'Functional, some wear', passed: true },
          { name: 'Drivetrain', score: 8, status: 'Good condition', passed: true },
        ]
      },
      loadingSystems: {
        score: 8,
        label: 'Loading Systems',
        parts: 156,
        assemblies: 2,
        status: 'Very Good',
        items: [
          { name: 'Cargo Bed', score: 8, status: 'Good condition', passed: true },
          { name: 'Tipping Mechanism', score: 7, status: 'Functional, some wear', passed: true },
        ]
      },
      cabinInteriors: {
        score: 8,
        label: 'Cabin & Interiors',
        parts: 124,
        assemblies: 4,
        status: 'Very Good',
        items: [
          { name: 'Seats & Upholstering', score: 7, status: 'Some wear, functional', passed: true },
          { name: 'Dashboard & Controls', score: 7, status: 'Functional, minor wear', passed: true },
          { name: 'AC System', status: 'Operational', passed: true },
        ]
      },
      exteriorBody: {
        score: 8,
        label: 'Exterior & Body',
        parts: 89,
        assemblies: 2,
        status: 'Very Good',
        items: [
          { name: 'Body Panels', score: 8, status: 'Good condition', passed: true },
          { name: 'Paint & Finish', score: 8, status: 'Good condition', passed: true },
          { name: 'Light & Mirrors', score: 7, status: 'Functional, minor wear', passed: true },
        ]
      },
      safetyBrakes: {
        score: 9,
        label: 'Safety & Brakes',
        parts: 67,
        assemblies: 2,
        status: 'Excellent',
        items: [
          { name: 'Brake System', score: 9, status: 'Excellent condition', passed: true },
          { name: 'ABS Module', score: 9, status: 'Fully functional', passed: true },
          { name: 'Safety Features', score: 8, status: 'Good condition', passed: true },
        ]
      },
    }
  }

  // TATA MOTORS 709G LPT – custom Quality Report ratings
  const is709gLPTInspection = truckName && (truckName.toLowerCase().includes('709g') || truckName.toLowerCase().includes('709 g')) && truckName.toLowerCase().includes('lpt') && truckName.toLowerCase().includes('tata')
  if (is709gLPTInspection) {
    return {
      coreSystems: {
        score: 8,
        label: 'Core Systems',
        parts: 278,
        assemblies: 3,
        status: 'Very Good',
        items: [
          { name: 'Engine', score: 8, status: 'Good condition', passed: true },
          { name: 'Transmission', score: 8, status: 'Good condition', passed: true },
          { name: 'Drivetrain', score: 8, status: 'Good condition', passed: true },
        ]
      },
      loadingSystems: {
        score: 8,
        label: 'Loading Systems',
        parts: 156,
        assemblies: 3,
        status: 'Very Good',
        items: [
          { name: 'Cargo Bed', score: 8, status: 'Good condition', passed: true },
          { name: 'Tipping Mechanism', score: 7, status: 'Functional, some wear', passed: true },
        ]
      },
      cabinInteriors: {
        score: 8,
        label: 'Cabin & Interiors',
        parts: 124,
        assemblies: 4,
        status: 'Very Good',
        items: [
          { name: 'Seats & Upholstering', score: 7, status: 'Functional, some wear', passed: true },
          { name: 'Dashboard & Controls', score: 7, status: 'Functional, some wear', passed: true },
        ]
      },
      exteriorBody: {
        score: 8,
        label: 'Exterior & Body',
        parts: 89,
        assemblies: 2,
        status: 'Very Good',
        items: [
          { name: 'Body Panels', score: 8, status: 'Good condition', passed: true },
          { name: 'Paint & Finish', score: 8, status: 'Good condition', passed: true },
          { name: 'Light & Mirrors', score: 7, status: 'Functional, some wear', passed: true },
        ]
      },
      safetyBrakes: {
        score: 9,
        label: 'Safety & Brakes',
        parts: 67,
        assemblies: 2,
        status: 'Excellent',
        items: [
          { name: 'Brake System', score: 9, status: 'Excellent condition', passed: true },
          { name: 'ABS Module', score: 9, status: 'Fully functional', passed: true },
          { name: 'Safety Features', score: 8, status: 'Good condition', passed: true },
        ]
      },
    }
  }
  
  // Default inspection data for other trucks (Quality Report ratings)
  return {
  coreSystems: {
    score: 8,
    label: 'Core Systems',
    parts: 278,
    assemblies: 3,
    status: 'Very Good',
    items: [
      { name: 'Engine', score: 8, status: 'Good condition', passed: true },
      { name: 'Transmission', score: 8, status: 'Good condition', passed: true },
      { name: 'Drivetrain', score: 9, status: 'Excellent condition', passed: true },
    ]
  },
  loadingSystems: {
    score: 8,
    label: 'Loading Systems',
    parts: 156,
    assemblies: 3,
    status: 'Very Good',
    items: [
      { name: 'Cargo Bed', score: 7, status: 'Functional, some wear', passed: true },
      { name: 'Tipping Mechanism', score: 7, status: 'Functional, some wear', passed: true },
    ]
  },
  cabinInteriors: {
    score: 8,
    label: 'Cabin & Interiors',
    parts: 124,
    assemblies: 4,
    status: 'Very Good',
    items: [
      { name: 'Seats & Upholstering', score: 9, status: 'Excellent condition', passed: true },
      { name: 'Dashboard & Controls', score: 8, status: 'Good condition', passed: true },
    ]
  },
  exteriorBody: {
    score: 9,
    label: 'Exterior & Body',
    parts: 89,
    assemblies: 2,
    status: 'Excellent',
    items: [
      { name: 'Body Panels', score: 9, status: 'Excellent condition', passed: true },
      { name: 'Paint & Finish', score: 9, status: 'Excellent condition', passed: true },
      { name: 'Light & Mirrors', score: 9, status: 'Excellent condition', passed: true },
    ]
  },
  safetyBrakes: {
    score: 9,
    label: 'Safety & Brakes',
    parts: 67,
    assemblies: 2,
    status: 'Excellent',
    items: [
      { name: 'Brake System', score: 9, status: 'Excellent condition', passed: true },
      { name: 'ABS Module', score: 9, status: 'Fully functional', passed: true },
      { name: 'Safety Features', score: 8, status: 'Good condition', passed: true },
    ]
  },
  }
}

type QualityGroup = { group: string; score: number; items: Array<{ name: string; score: number }> }

const groupStatus = (n: number) => (n >= 9 ? 'Excellent' : n >= 8 ? 'Very Good' : n >= 7 ? 'Good' : n >= 6 ? 'Fair' : 'Needs Attention')
const itemStatus = (n: number) =>
  n >= 9 ? 'Excellent condition' : n >= 8 ? 'Good condition' : n >= 6 ? 'Functional, some wear' : 'Needs attention'

/**
 * The quality report from `trucks.quality_scores` (the web report's five groups),
 * in the shape getInspectionData returns. Parts and assemblies have no DB source,
 * so they keep the default report's figures. Null when the row has no scores.
 */
const inspectionDataFromScores = (groups: unknown) => {
  if (!Array.isArray(groups) || groups.length === 0) return null
  const defaults = getInspectionData(null) as Record<string, { label: string; parts: number; assemblies: number }>
  const keyFor: Record<string, string> = {
    'Core Systems': 'coreSystems',
    'Loading Systems': 'loadingSystems',
    'Cabin & Interiors': 'cabinInteriors',
    'Exterior & Body': 'exteriorBody',
    'Safety & Brakes': 'safetyBrakes',
  }
  const data: Record<string, { score: number; label: string; parts: number; assemblies: number; status: string; items: Array<{ name: string; score: number; status: string; passed: boolean }> }> = {}
  for (const g of groups as QualityGroup[]) {
    const key = keyFor[g?.group]
    if (!key || typeof g.score !== 'number') return null
    data[key] = {
      score: g.score,
      label: g.group,
      parts: defaults[key]?.parts ?? 0,
      assemblies: (g.items ?? []).length,
      status: groupStatus(g.score),
      items: (g.items ?? []).map((item) => ({ name: item.name, score: item.score, status: itemStatus(item.score), passed: item.score >= 5 })),
    }
  }
  return data
}

// Truck Highlights. Power Steering comes from the inspection form; a truck
// with no answer (listed before it was asked) keeps the badge while we test.
// Fuel Efficient is hardcoded for every truck for now.
const highlightsFor = (truck: any) => [
  ...(truck?.power_steering === false ? [] : [{ icon: 'power', label: 'Power Steering', desc: 'Easy maneuvering' }]),
  { icon: 'fuel', label: 'Fuel Efficient', desc: 'Optimized consumption' },
]

// Axlerator Advantages
const axleratorAdvantages = [
  { title: '200+ Point Check', subtitle: 'Certified quality', color: '#059669' },
  { title: 'RC Transfer', subtitle: 'Hassle-free', color: '#7c3aed' },
  { title: 'Flexi Finance', subtitle: 'Easy EMI', color: '#ea580c' },
]

export default function TruckDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [truck, setTruck] = useState<any>(null)
  const [similarTrucks, setSimilarTrucks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('specs')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showContactForm, setShowContactForm] = useState(false)
  const [showTestDriveForm, setShowTestDriveForm] = useState(false)
  const [showFullReport, setShowFullReport] = useState(false)
  const [showReportOTPModal, setShowReportOTPModal] = useState(false)
  const [reportPhone, setReportPhone] = useState('')
  const [reportOTP, setReportOTP] = useState('')
  const [reportOTPStep, setReportOTPStep] = useState<'phone' | 'otp'>('phone')
  const [reportOTPLoading, setReportOTPLoading] = useState(false)
  const [reportOTPError, setReportOTPError] = useState('')
  const [hasVerifiedReportOTP, setHasVerifiedReportOTP] = useState(false)
  const [activeReportTab, setActiveReportTab] = useState('coreSystems')
  const [expandedItems, setExpandedItems] = useState<string[]>(['coreSystems'])
  const [isVisible, setIsVisible] = useState(false)
  const [fetchedImages, setFetchedImages] = useState<string[]>([])
  const thumbStripRef = useRef<HTMLDivElement>(null)
  // Browsers without an H.264 decoder (e.g. Firefox snap builds) can't play these MP4s
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({})
  const [lightboxOpen, setLightboxOpen] = useState(false)
  
  // Finance Calculator
  const [financeAmount, setFinanceAmount] = useState(3000000)
  const [initialPayment, setInitialPayment] = useState(0)
  const [loanPeriod, setLoanPeriod] = useState(60)
  const [monthlyEMI, setMonthlyEMI] = useState(0)
  const [interestAmount, setInterestAmount] = useState(0)
  const rateOfInterest = 10.5

  const loadTruckData = useCallback(async () => {
    try {
      const res = await fetch(`/api/trucks/${params.id}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data && !data.error) {
          setTruck(data)
        } else {
          // Show error message instead of dummy data
          console.error('Truck not found or error in response:', data)
          setTruck(null)
        }
      } else {
        // Handle API error
        const errorData = await res.json().catch(() => ({}))
        console.error('Failed to load truck:', errorData.error || 'Unknown error')
        setTruck(null)
      }
    } catch (err) {
      console.error('Error loading truck:', err)
      setTruck(null)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  const loadSimilarTrucks = useCallback(async () => {
    try {
      const res = await fetch(`/api/trucks/${params.id}/similar`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setSimilarTrucks(data)
      }
    } catch (err) {
      console.error('Error loading similar trucks:', err)
      setSimilarTrucks([])
    }
  }, [params.id])

  const computeEMI = useCallback(() => {
    const principal = financeAmount - initialPayment
    const monthlyRate = rateOfInterest / 12 / 100
    const months = loanPeriod

    if (principal <= 0) {
      setMonthlyEMI(0)
      setInterestAmount(0)
      return
    }

    const emiCalc = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1)
    setMonthlyEMI(emiCalc)
    setInterestAmount((emiCalc * months) - principal)
  }, [financeAmount, initialPayment, loanPeriod])

  useEffect(() => {
    loadTruckData()
    setIsVisible(true)
  }, [loadTruckData])

  // Keep the selected thumbnail in view; the strip holds every image, so it must scroll.
  useEffect(() => {
    const strip = thumbStripRef.current
    const active = strip?.querySelector<HTMLElement>('.td-thumb.active')
    if (!strip || !active) return
    strip.scrollTo({
      left: active.offsetLeft - strip.clientWidth / 2 + active.clientWidth / 2,
      behavior: 'smooth',
    })
  }, [selectedImageIndex, fetchedImages])

  useEffect(() => {
    if (truck) {
      const isAceGold7908 = truck.name === 'Tata Ace Gold (7908)' || (truck.name?.includes?.('Tata Ace Gold') && truck.name?.includes?.('7908'))
      const isAceGoldPlain = truck.name === 'Tata Ace Gold' && !truck.name?.includes?.('7908')
      const is1512GLPT = truck.name === 'TATA 1512G LPT' || truck.name === 'Tata 1512G LPT' || (truck.name?.includes?.('1512') && truck.name?.includes?.('LPT') && truck.name?.toLowerCase().includes?.('tata'))
      const is1212LPT = (truck.name || '').toLowerCase().includes('1212') && (truck.name || '').toLowerCase().includes('lpt') && (truck.name || '').toLowerCase().includes('tata')
      const isEicher2110L = (truck.name || '').toLowerCase().includes('2110') && ((truck.name || '').toLowerCase().includes('2110l') || (truck.model || '').toUpperCase().includes('2110L'))
      const isBajajMaximaCNGFinance = (truck.name || '').toLowerCase().includes('bajaj') && (truck.name || '').toLowerCase().includes('maxima') && (truck.name || '').toLowerCase().includes('cng')
      const is609G = (truck.name || '').toLowerCase().includes('609') && ((truck.name || '').toLowerCase().includes('609g') || (truck.name || '').toLowerCase().includes('609 g')) && ((truck.name || '').toLowerCase().includes('tata') || truck.manufacturer === 'Tata Motors')
      const is709gLPTFinance = (truck.name || '').toLowerCase().includes('709') && ((truck.name || '').toLowerCase().includes('709g') || (truck.name || '').toLowerCase().includes('709 g')) && (truck.name || '').toLowerCase().includes('lpt') && ((truck.name || '').toLowerCase().includes('tata') || truck.manufacturer === 'Tata Motors')
      const is1109gLPTFinance = (truck.name || '').toLowerCase().includes('1109') && (truck.name || '').toLowerCase().includes('lpt') && ((truck.name || '').toLowerCase().includes('tata') || truck.manufacturer === 'Tata Motors')
      const isAshokLeyland1415Finance = truck.name === 'ASHOK LEYLAND ECOMET STAR 1415 HE'
      const isEicher2059XPFinance = (truck.name || '').toLowerCase().includes('2059') && ((truck.name || '').toLowerCase().includes('eicher') || (truck.manufacturer === 'Eicher Motors' && (truck.model || '').toLowerCase().includes('2059')))
      const isEicher1075HSDFinance = (truck.name || '').toLowerCase().includes('1075') && ((truck.name || '').toLowerCase().includes('eicher') || (truck.manufacturer === 'Eicher Motors' && (truck.model || '').toLowerCase().includes('1075')))
      const isMahindraBoleroFinance = truck.name === 'Mahindra Bolero Maxitruck Plus'
      const isSmlIsuzuZT54Finance = (truck.name || '').toLowerCase().includes('zt54') && (truck.name || '').toLowerCase().includes('sml')
      setFinanceAmount(
        isAceGold7908 ? 250000
        : isAceGoldPlain ? 240000
        : is1512GLPT ? 1530000
        : is1212LPT ? 1420000
        : is609G ? 1000000
        : is709gLPTFinance ? 1025000
        : is1109gLPTFinance ? 1350000
        : isAshokLeyland1415Finance ? 1430000
        : isEicher2059XPFinance ? 920000
        : isEicher1075HSDFinance ? 950000
        : isEicher2110L ? 1475000
        : isBajajMaximaCNGFinance ? 260000
        : isMahindraBoleroFinance ? 630000
        : isSmlIsuzuZT54Finance ? 630000
        : parseFloat(truck.price)
      )
      loadSimilarTrucks()
      
      // The truck's own photos and videos, written to `trucks` by the forms
      // pipeline and the backfill, come first. The folder lookup by name is the
      // fallback, and gives some trucks another truck's photos.
      const dbMedia = sortByShowcaseNumber([
        ...(Array.isArray(truck.gallery) ? truck.gallery : []),
        ...(Array.isArray(truck.videos) ? truck.videos : []),
      ].filter((url: unknown): url is string => typeof url === 'string' && url.length > 0))
      const truckName = dbMedia.length > 0 ? '' : truck.name || ''
      if (dbMedia.length > 0) setFetchedImages(dbMedia)

      if (truckName) {
        // Pass the truck's own hero image / registration number so the API can find
        // gallery folders that are named by registration number instead of truck name.
        const imageParams = new URLSearchParams({ truckName })
        if (truck.imageUrl) imageParams.set('imageUrl', truck.imageUrl)
        const registrationNumber = truck.registrationNumber || truck.registration_number
        if (registrationNumber) imageParams.set('registrationNumber', registrationNumber)
        console.log(`[Truck Details] 🚀 Fetching images for truck: "${truckName}"`)
        console.log(`[Truck Details] API URL: /api/truck-images?${imageParams.toString()}`)
        fetch(`/api/truck-images?${imageParams.toString()}`, {
          cache: 'no-store',
        })
          .then(res => {
            if (!res.ok) {
              console.error(`[Truck Details] API response not OK: ${res.status}`)
              return res.json().then(err => { throw new Error(err.error || 'API error') })
            }
            return res.json()
          })
          .then(data => {
            console.log(`[Truck Details] API response:`, data)
            if (data.images && Array.isArray(data.images) && data.images.length > 0) {
              console.log(`[Truck Details] ✅ Setting ${data.images.length} images from API`)
              console.log(`[Truck Details] First image URL:`, data.images[0])
              setFetchedImages(data.images)
            } else {
              // No images in Supabase for this truck — expected when folder is empty or not yet uploaded
              console.warn(`[Truck Details] No images in storage for truck: "${truckName}"`, data.message || '')
              setFetchedImages([])
            }
          })
          .catch(err => {
            console.error(`[Truck Details] Error fetching truck images for "${truckName}":`, err)
          })
      }
      
    }
  }, [truck, loadSimilarTrucks])

  useEffect(() => {
    computeEMI()
  }, [computeEMI])

  const displayPrice = (price: string | number | undefined | null) => {
    if (price === undefined || price === null) return '₹0'
    const num = typeof price === 'string' ? parseFloat(price) : price
    if (isNaN(num)) return '₹0'
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`
    return `₹${num.toLocaleString('en-IN')}`
  }

  const shortPrice = (price: string | number | undefined | null) => {
    if (price === undefined || price === null) return '0'
    const num = typeof price === 'string' ? parseFloat(price) : price
    if (isNaN(num)) return '0'
    if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`
    if (num >= 100000) return `${(num / 100000).toFixed(1)}L`
    return num.toLocaleString('en-IN')
  }

  const isWhatsappHrTruck = truck?.name === 'HR 38 W 2162'
  const isAshokLeylandTruck = truck?.name === 'ASHOK LEYLAND ECOMET STAR 1415 HE'
  const isAshokLeyland1615Truck = truck?.name === 'ASHOK LEYLAND ECOMET STAR 1615 HE'
  const isMahindraBoleroTruck = truck?.name === 'Mahindra Bolero Maxitruck Plus'
  const isSmlIsuzuTruck = truck?.name === 'SML Isuzu Samrat 4760gs'
  const isSmlIsuzuZT54 = (truck?.name || '').toLowerCase().includes('zt54') && (truck?.name || '').toLowerCase().includes('sml')
  const isTata1412Truck = truck?.name === 'Tata 1412 LPT'
  const isTataAceGold7908 = truck?.name === 'Tata Ace Gold (7908)' || (truck?.name?.includes?.('Tata Ace Gold') && truck?.name?.includes?.('7908'))
  const isTataAceGoldPlain = truck?.name === 'Tata Ace Gold' && !truck?.name?.includes?.('7908')
  const isTata1512GLPT = truck?.name === 'TATA 1512G LPT' || truck?.name === 'Tata 1512G LPT' || (truck?.name?.includes?.('1512') && truck?.name?.includes?.('LPT') && truck?.name?.toLowerCase().includes?.('tata'))
  const isTata1212LPT = (truck?.name || '').toLowerCase().includes('1212') && (truck?.name || '').toLowerCase().includes('lpt') && (truck?.name || '').toLowerCase().includes('tata')
  const isTata609G = (truck?.name || '').toLowerCase().includes('609') && ((truck?.name || '').toLowerCase().includes('609g') || (truck?.name || '').toLowerCase().includes('609 g')) && ((truck?.name || '').toLowerCase().includes('tata') || truck?.manufacturer === 'Tata Motors')
  const isTata709gLPT = (truck?.name || '').toLowerCase().includes('709') && ((truck?.name || '').toLowerCase().includes('709g') || (truck?.name || '').toLowerCase().includes('709 g')) && (truck?.name || '').toLowerCase().includes('lpt') && ((truck?.name || '').toLowerCase().includes('tata') || truck?.manufacturer === 'Tata Motors')
  const isTata1109gLPT = (truck?.name || '').toLowerCase().includes('1109') && (truck?.name || '').toLowerCase().includes('lpt') && ((truck?.name || '').toLowerCase().includes('tata') || truck?.manufacturer === 'Tata Motors')
  const isEicherPro2110L = (truck?.name || '').toLowerCase().includes('2110') && ((truck?.name || '').toLowerCase().includes('2110l') || (truck?.model || '').toUpperCase().includes('2110L'))
  const isEicher2059XPTruck = (truck?.name || '').toLowerCase().includes('2059') &&
    ((truck?.name || '').toLowerCase().includes('eicher') || (truck?.manufacturer === 'Eicher Motors' && (truck?.model || '').toLowerCase().includes('2059')))
  const isEicher1075HSDTruck = (truck?.name || '').toLowerCase().includes('1075') &&
    ((truck?.name || '').toLowerCase().includes('eicher') || (truck?.manufacturer === 'Eicher Motors' && (truck?.model || '').toLowerCase().includes('1075')))
  const isBajajMaximaCNG = (truck?.name || '').toLowerCase().includes('bajaj') && (truck?.name || '').toLowerCase().includes('maxima') && (truck?.name || '').toLowerCase().includes('cng')
  const useHardcodedDisplayOverrides = false
  // Tata Ace Gold (7908) – display values from Web Report UP14HT7908
  const tataAceGoldDisplay = useHardcodedDisplayOverrides && isTataAceGold7908 ? { price: 250000, year: 2019, yearMonth: '04/2019', kms: 116509, hp: 15.54, model: 'TATA ACE GOLD BS-IV', rto: 'Ghaziabad', insurance: '14.12.2023', gearbox: '5-Forward, 1-Reverse', fuel: 'Diesel (BS-IV)', grossPayloadKg: 1550, netPayloadKg: 710, bodyFt: 7.2, tyres: 4, ownership: '1st Owner' } : null
  // Eicher Pro 2110L – display values from provided specs
  const eicherPro2110LDisplay = useHardcodedDisplayOverrides && isEicherPro2110L ? { price: 1475000, yearMonth: '11/2022', kms: 240551, hp: 160, model: 'PRO 2110L', rto: 'Bahadurgarh, Haryana', insurance: '12.02.2026', gearbox: '5 forward, 1 reverse', fuel: 'Diesel', grossPayloadKg: 11990, netPayloadKg: 7317, bodyFt: 22, tyres: 6, ownership: '1st Owner' } : null
  // Bajaj Maxima CNG – display values from provided specs (Net/Gross Payload: –)
  const bajajMaximaCNGDisplay = useHardcodedDisplayOverrides && isBajajMaximaCNG ? { price: 260000, yearMonth: '–', kms: 7136, hp: 10, model: 'BAJAJ MAXIMA CARGO CNG', rto: 'RAJPUR ROAD', insurance: '09/06/2026', gearbox: '4 forward, 1 reverse', fuel: 'CNG', grossPayloadKg: null as number | null, netPayloadKg: null as number | null, bodyFt: 6, tyres: 3, ownership: '1st Owner' } : null
  // ASHOK LEYLAND ECOMET STAR 1415 HE – display values from provided specs
  const ashokLeyland1415Display = useHardcodedDisplayOverrides && isAshokLeylandTruck ? {
    price: 1430000,
    yearMonth: '03/2022',
    kms: 236133,
    hp: 142.71,
    model: 'CA1415/52 H CC G',
    rto: 'GHAZIABAD',
    insurance: '01/01/27',
    gearbox: '5 forward, 1 reverse',
    fuel: 'CNG',
    grossPayloadKg: 14250,
    netPayloadKg: 7980,
    bodyFt: 24,
    tyres: 6,
    ownership: '1st Owner',
  } : null
  // Eicher 2059XP – display values from provided specs
  const eicher2059XPDisplay = useHardcodedDisplayOverrides && isEicher2059XPTruck ? {
    price: 920000,
    yearMonth: '09/2020',
    kms: 183889,
    hp: 85,
    model: 'CNG F HSD VE',
    rto: 'RAJPUR ROAD',
    insurance: '30/10/2025',
    gearbox: '5 forward, 1 reverse',
    fuel: 'CNG',
    grossPayloadKg: 7490,
    netPayloadKg: 3800,
    bodyFt: 14,
    tyres: 4,
    ownership: '1st Owner',
  } : null
  // Eicher Pro 1075 F HSD – display values from provided specs
  const eicher1075HSDDisplay = useHardcodedDisplayOverrides && isEicher1075HSDTruck ? {
    price: 950000,
    yearMonth: '11/2018',
    kms: 229537,
    hp: 110,
    model: 'DCR38CBC 85B6M5 TT',
    rto: 'RAJPUR ROAD',
    insurance: '23/01/27',
    gearbox: '5 forward, 1 reverse',
    fuel: 'Diesel',
    grossPayloadKg: 7450,
    netPayloadKg: 4600,
    bodyFt: 17,
    tyres: 6,
    ownership: '1st Owner',
  } : null
  // Mahindra Bolero Maxitruck Plus – display price
  const mahindraBoleroDisplay = useHardcodedDisplayOverrides && isMahindraBoleroTruck ? { price: 630000 } : null
  // SML Isuzu ZT54 – display values from provided specs
  const smlIsuzuZT54Display = useHardcodedDisplayOverrides && isSmlIsuzuZT54 ? {
    price: 630000,
    yearMonth: '04/2017',
    kms: 229537,
    powerDisplay: '3544 cc',
    model: 'ZT 54 SM B EL WB SML ISUZU LTD',
    rto: 'GHAZIABAD, UP',
    insurance: '20/05/26',
    gearbox: '5 forward, 1 reverse',
    fuel: 'Diesel',
    grossPayloadKg: 10250,
    netPayloadKg: 5890,
    bodyFt: 22,
    tyres: 6,
    ownership: '1st Owner',
  } : null
  // Tata Ace Gold (no 7908) – folder Tata Ace Gold-20260307T052504Z-1-001
  const tataAceGoldPlainDisplay = useHardcodedDisplayOverrides && isTataAceGoldPlain ? { price: 240000, yearMonth: '12/2018', kms: 82185, hp: 15.54, model: 'TATA ACE GOLD BS-IV', rto: 'Ghaziabad', insurance: '17.03.2026', gearbox: '5-Forward, 1-Reverse', fuel: 'Diesel (BS-IV)', grossPayloadKg: 1550, netPayloadKg: 710, bodyFt: 7.2, tyres: 4, ownership: '2nd Owner' } : null
  // TATA 1512G LPT – display values from inspection/legal report
  const tata1512GLPTDisplay = useHardcodedDisplayOverrides && isTata1512GLPT ? { price: 1530000, yearMonth: '10/2021', kms: 209311, hp: 123.28, model: '1512G LPT DCR48CBC 125B6M5', rto: 'Rajpur Road', insurance: '24.09.2026', gearbox: '5-Forward, 1-Reverse', fuel: 'CNG', grossPayloadKg: 16020, netPayloadKg: 8620, bodyFt: 22, tyres: 6, ownership: '1st Owner' } : null
  // Tata 1212 LPT – display values from provided specs
  const tata1212LPTDisplay = useHardcodedDisplayOverrides && isTata1212LPT ? { price: 1420000, yearMonth: '11/2022', kms: 152804, hp: 123.28, model: '1212 LPT DCR48CBC 125B6M5', rto: 'Faridabad', insurance: '30.12.2025', gearbox: '5-Forward, 1-Reverse', fuel: 'Diesel', grossPayloadKg: 11990, netPayloadKg: 7930, bodyFt: 22, tyres: 6, ownership: '1st Owner' } : null
  // TATA MOTORS 609G – display values from provided specs
  const tata609GDisplay = useHardcodedDisplayOverrides && isTata609G ? { price: 1000000, yearMonth: '07/2022', kms: 78699, hp: 83.08, model: 'SFC DCR33CBC 85B6M5', rto: 'Rajpur Road', insurance: '02.08.2026', gearbox: '5-Forward, 1-Reverse', fuel: 'CNG', grossPayloadKg: 5950, netPayloadKg: 3480, bodyFt: 10, tyres: 4, ownership: '1st Owner' } : null
  // TATA MOTORS 709G LPT – display values from provided specs
  const tata709gLPTDisplay = useHardcodedDisplayOverrides && isTata709gLPT ? { price: 1025000, yearMonth: '11/2021', kms: 129420, hp: 83.08, model: '709G LPT DCR38CBC 85B6M5 TT', rto: 'Rajpur Road', insurance: '20.02.2027', gearbox: '5-Forward, 1-Reverse', fuel: 'CNG', grossPayloadKg: 7490, netPayloadKg: 4500, bodyFt: 17, tyres: 6, ownership: '2nd Owner' } : null
  // Tata 1109g LPT – display values from provided specs
  const tata1109gLPTDisplay = useHardcodedDisplayOverrides && isTata1109gLPT ? { price: 1350000, yearMonth: '03/2023', kms: 162134, hp: 85, model: '1109G LPT DCR49CBC 85B6M5XD', rto: 'Gurugram', insurance: '06.04.2026', gearbox: '5-Forward, 1-Reverse', fuel: 'CNG', grossPayloadKg: 11250, netPayloadKg: 7500, bodyFt: 22, tyres: 6, ownership: '1st Owner' } : null

  const getGalleryImages = () => {
    if (!truck?.imageUrl) return []

    // Declare truckName once for reuse throughout the function
    const truckName = truck.name || ''
    
    // FIRST: Check if we have fetched images from API for ANY truck
    // This should work for all trucks that have images in Supabase
    if (fetchedImages.length > 0) {
      console.log(`[getGalleryImages] ✅ Using ${fetchedImages.length} fetched images from API for truck: "${truckName}"`)
      console.log(`[getGalleryImages] First image: ${fetchedImages[0]}`)
      return fetchedImages
    } else {
      console.warn(`[getGalleryImages] ⚠️ No fetched images yet for truck: "${truckName}" - will check for hardcoded fallbacks`)
    }

    // ASHOK LEYLAND ECOMET STAR 1615 HE - use all Supabase images for this truck
    if (isAshokLeyland1615Truck) {
      return [
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1615_HE/1771051536079-Copy%20of%20IMG_20260212_155025.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1615_HE/1771051538587-Copy%20of%20IMG_20260212_155108.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1615_HE/1771051540178-Copy%20of%20IMG_20260212_155128.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1615_HE/1771051541494-Copy%20of%20IMG_20260212_155134.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1615_HE/1771051542647-Copy%20of%20IMG_20260212_155147.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1615_HE/1771051543955-Copy%20of%20IMG_20260212_155208.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1615_HE/1771051545491-Copy%20of%20IMG_20260212_155225.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1615_HE/1771051547798-Copy%20of%20IMG_20260212_155233.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1615_HE/1771051549167-Copy%20of%20IMG_20260212_155240.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1615_HE/1771051551105-Copy%20of%20IMG_20260212_155244.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1615_HE/1771051552635-Copy%20of%20IMG_20260212_155249.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1615_HE/1771051554115-Copy%20of%20IMG_20260212_155259.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1615_HE/1771051555702-Copy%20of%20IMG_20260212_155302.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1615_HE/1771051556887-Copy%20of%20IMG_20260212_155306.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1615_HE/1771051558385-Copy%20of%20IMG_20260212_155327.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1615_HE/1771051559559-Copy%20of%20IMG_20260212_155357.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1615_HE/1771051560828-Copy%20of%20IMG_20260212_155403.jpg`
      ]
    }

    // Tata 1412 LPT - use all Supabase images for this truck
    if (isTata1412Truck) {
      return [
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051039594-Copy%20of%201770627796535.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051042475-Copy%20of%201770627796543.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051044778-Copy%20of%201770627796595.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051046212-Copy%20of%201770627796605.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051048090-Copy%20of%201770627796618.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051050426-Copy%20of%201770627796628.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051051988-Copy%20of%201770627796639.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051053687-Copy%20of%201770627796652.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051055287-Copy%20of%201770627796663.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051056919-Copy%20of%201770627796675.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051058586-Copy%20of%201770627796690.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051060174-Copy%20of%201770627796700.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051061554-Copy%20of%201770627796712.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051063187-Copy%20of%201770627796725.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051064746-Copy%20of%201770627796744.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051066144-Copy%20of%201770627796761.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051067680-Copy%20of%201770627796775.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051069095-Copy%20of%201770627796788.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051071264-Copy%20of%201770627796802.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051073050-Copy%20of%201770627796817.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051074732-Copy%20of%201770627796829.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051077138-Copy%20of%201770627796844.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051078984-Copy%20of%201770627796856.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051080882-Copy%20of%201770627796867.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051083270-Copy%20of%201770627796882.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051085327-Copy%20of%201770627796899.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051086840-Copy%20of%201770627796915.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051088551-Copy%20of%201770627796928.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051090045-Copy%20of%201770627796939.jpg`,
        `${TRUCK_IMAGES_BASE}/TATA_1412_LPT/1771051091532-Copy%20of%201770627796948.jpg`
      ]
    }

    // SML Isuzu Samrat 4760gs - use all Supabase images for this truck
    if (isSmlIsuzuTruck) {
      return [
        `${TRUCK_IMAGES_BASE}/SML_ISUZU_SAMRAT_4760GS/1771050688594-Copy%20of%20IMG_20260210_121036.jpg`,
        `${TRUCK_IMAGES_BASE}/SML_ISUZU_SAMRAT_4760GS/1771050690478-Copy%20of%20IMG_20260210_121057.jpg`,
        `${TRUCK_IMAGES_BASE}/SML_ISUZU_SAMRAT_4760GS/1771050692026-Copy%20of%20IMG_20260210_121117.jpg`,
        `${TRUCK_IMAGES_BASE}/SML_ISUZU_SAMRAT_4760GS/1771050693964-Copy%20of%20IMG_20260210_121130.jpg`,
        `${TRUCK_IMAGES_BASE}/SML_ISUZU_SAMRAT_4760GS/1771050694984-Copy%20of%20IMG_20260210_121133.jpg`,
        `${TRUCK_IMAGES_BASE}/SML_ISUZU_SAMRAT_4760GS/1771050696050-Copy%20of%20IMG_20260210_121154.jpg`,
        `${TRUCK_IMAGES_BASE}/SML_ISUZU_SAMRAT_4760GS/1771050698242-Copy%20of%20IMG_20260210_121207.jpg`,
        `${TRUCK_IMAGES_BASE}/SML_ISUZU_SAMRAT_4760GS/1771050700129-Copy%20of%20IMG_20260210_121224.jpg`,
        `${TRUCK_IMAGES_BASE}/SML_ISUZU_SAMRAT_4760GS/1771050702337-Copy%20of%20IMG_20260210_121251.jpg`,
        `${TRUCK_IMAGES_BASE}/SML_ISUZU_SAMRAT_4760GS/1771050703773-Copy%20of%20IMG_20260210_121301.jpg`,
        `${TRUCK_IMAGES_BASE}/SML_ISUZU_SAMRAT_4760GS/1771050705192-Copy%20of%20IMG_20260210_121304.jpg`,
        `${TRUCK_IMAGES_BASE}/SML_ISUZU_SAMRAT_4760GS/1771050706279-Copy%20of%20IMG_20260210_121316.jpg`,
        `${TRUCK_IMAGES_BASE}/SML_ISUZU_SAMRAT_4760GS/1771050707554-Copy%20of%20IMG_20260210_121327.jpg`,
        `${TRUCK_IMAGES_BASE}/SML_ISUZU_SAMRAT_4760GS/1771050708637-Copy%20of%20IMG_20260210_121356.jpg`,
        `${TRUCK_IMAGES_BASE}/SML_ISUZU_SAMRAT_4760GS/1771050710236-Copy%20of%20IMG_20260210_121422.jpg`,
        `${TRUCK_IMAGES_BASE}/SML_ISUZU_SAMRAT_4760GS/1771050711704-Copy%20of%20IMG_20260210_121437.jpg`,
        `${TRUCK_IMAGES_BASE}/SML_ISUZU_SAMRAT_4760GS/1771050713169-Copy%20of%20IMG_20260210_121445.jpg`,
        `${TRUCK_IMAGES_BASE}/SML_ISUZU_SAMRAT_4760GS/1771050714612-Copy%20of%20IMG_20260210_121451.jpg`,
        `${TRUCK_IMAGES_BASE}/SML_ISUZU_SAMRAT_4760GS/1771050715893-Copy%20of%20IMG_20260210_121616.jpg`,
        `${TRUCK_IMAGES_BASE}/SML_ISUZU_SAMRAT_4760GS/1771050716994-Copy%20of%20IMG_20260210_121627.jpg`,
        `${TRUCK_IMAGES_BASE}/SML_ISUZU_SAMRAT_4760GS/1771050718740-Copy%20of%20IMG_20260210_121631.jpg`,
        `${TRUCK_IMAGES_BASE}/SML_ISUZU_SAMRAT_4760GS/1771050720571-Copy%20of%20IMG_20260210_121634.jpg`,
        `${TRUCK_IMAGES_BASE}/SML_ISUZU_SAMRAT_4760GS/1771050721587-Copy%20of%20IMG_20260210_121639.jpg`
      ]
    }

    // Mahindra Bolero Maxitruck Plus - use all Supabase images for this truck
    if (isMahindraBoleroTruck) {
      return [
        `${TRUCK_IMAGES_BASE}/MAHINDRA_BOLERO_MAXITRUCK_PLUS/1771050476007-Copy%20of%20IMG-20260211-WA0008.jpg`,
        `${TRUCK_IMAGES_BASE}/MAHINDRA_BOLERO_MAXITRUCK_PLUS/1771050476645-Copy%20of%20IMG-20260211-WA0010.jpg`,
        `${TRUCK_IMAGES_BASE}/MAHINDRA_BOLERO_MAXITRUCK_PLUS/1771050476891-Copy%20of%20IMG-20260211-WA0012.jpg`,
        `${TRUCK_IMAGES_BASE}/MAHINDRA_BOLERO_MAXITRUCK_PLUS/1771050477143-Copy%20of%20IMG-20260211-WA0013.jpg`,
        `${TRUCK_IMAGES_BASE}/MAHINDRA_BOLERO_MAXITRUCK_PLUS/1771050477408-Copy%20of%20IMG-20260211-WA0014.jpg`,
        `${TRUCK_IMAGES_BASE}/MAHINDRA_BOLERO_MAXITRUCK_PLUS/1771050477983-Copy%20of%20IMG-20260211-WA0015.jpg`,
        `${TRUCK_IMAGES_BASE}/MAHINDRA_BOLERO_MAXITRUCK_PLUS/1771050478635-Copy%20of%20IMG-20260211-WA0016.jpg`,
        `${TRUCK_IMAGES_BASE}/MAHINDRA_BOLERO_MAXITRUCK_PLUS/1771050478883-Copy%20of%20IMG-20260211-WA0017.jpg`,
        `${TRUCK_IMAGES_BASE}/MAHINDRA_BOLERO_MAXITRUCK_PLUS/1771050479111-Copy%20of%20IMG-20260211-WA0018.jpg`,
        `${TRUCK_IMAGES_BASE}/MAHINDRA_BOLERO_MAXITRUCK_PLUS/1771050479398-Copy%20of%20IMG-20260211-WA0019.jpg`,
        `${TRUCK_IMAGES_BASE}/MAHINDRA_BOLERO_MAXITRUCK_PLUS/1771050479639-Copy%20of%20IMG-20260211-WA0020.jpg`,
        `${TRUCK_IMAGES_BASE}/MAHINDRA_BOLERO_MAXITRUCK_PLUS/1771050479885-Copy%20of%20IMG-20260211-WA0021.jpg`,
        `${TRUCK_IMAGES_BASE}/MAHINDRA_BOLERO_MAXITRUCK_PLUS/1771050480234-Copy%20of%20IMG-20260211-WA0022.jpg`,
        `${TRUCK_IMAGES_BASE}/MAHINDRA_BOLERO_MAXITRUCK_PLUS/1771050480521-Copy%20of%20IMG-20260211-WA0023.jpg`,
        `${TRUCK_IMAGES_BASE}/MAHINDRA_BOLERO_MAXITRUCK_PLUS/1771050480756-Copy%20of%20IMG-20260211-WA0024.jpg`
      ]
    }

    // ASHOK LEYLAND ECOMET STAR 1415 HE - use all Supabase images for this truck
    if (isAshokLeylandTruck) {
      return [
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1415_HE/1771050178277-Copy%20of%20IMG_20260212_153453.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1415_HE/1771050181033-Copy%20of%20IMG_20260212_153459.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1415_HE/1771050183070-Copy%20of%20IMG_20260212_153511.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1415_HE/1771050185507-Copy%20of%20IMG_20260212_153528.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1415_HE/1771050186848-Copy%20of%20IMG_20260212_153537.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1415_HE/1771050189056-Copy%20of%20IMG_20260212_153551.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1415_HE/1771050191154-Copy%20of%20IMG_20260212_153610.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1415_HE/1771050193439-Copy%20of%20IMG_20260212_153623.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1415_HE/1771050194651-Copy%20of%20IMG_20260212_153653.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1415_HE/1771050196365-Copy%20of%20IMG_20260212_153715.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1415_HE/1771050197703-Copy%20of%20IMG_20260212_153719.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1415_HE/1771050199000-Copy%20of%20IMG_20260212_153725.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1415_HE/1771050200642-Copy%20of%20IMG_20260212_153737.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1415_HE/1771050202313-Copy%20of%20IMG_20260212_153740.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1415_HE/1771050203845-Copy%20of%20IMG_20260212_153750.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1415_HE/1771050205255-Copy%20of%20IMG_20260212_153753.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1415_HE/1771050207088-Copy%20of%20IMG_20260212_153802.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1415_HE/1771050208725-Copy%20of%20IMG_20260212_153812.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1415_HE/1771050210912-Copy%20of%20IMG_20260212_153815.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1415_HE/1771050212428-Copy%20of%20IMG_20260212_153910.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1415_HE/1771050213875-Copy%20of%20IMG_20260212_153913.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1415_HE/1771050215262-Copy%20of%20IMG_20260212_153915.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1415_HE/1771050216453-Copy%20of%20IMG_20260212_154020.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1415_HE/1771050218837-Copy%20of%20IMG_20260212_154031.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1415_HE/1771050220456-Copy%20of%20IMG_20260212_154035.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1415_HE/1771050222013-Copy%20of%20IMG_20260212_154041.jpg`,
        `${TRUCK_IMAGES_BASE}/ASHOK_LEYLAND_ECOMET_STAR_1415_HE/1771050223525-Copy%20of%20IMG_20260212_154541.jpg`
      ]
    }

    // WhatsApp gallery for HR 38 W 2162 - use all Supabase images for this truck
    if (isWhatsappHrTruck) {
      return [
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136466662-WhatsApp_Image_2025-12-17_at_6.33.50_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136467762-WhatsApp_Image_2025-12-17_at_6.33.51_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136467977-WhatsApp_Image_2025-12-17_at_6.33.51_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136468190-WhatsApp_Image_2025-12-17_at_6.33.51_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136468420-WhatsApp_Image_2025-12-17_at_6.33.52_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136468670-WhatsApp_Image_2025-12-17_at_6.33.52_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136468856-WhatsApp_Image_2025-12-17_at_6.33.54_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136469145-WhatsApp_Image_2025-12-17_at_6.33.55_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136469299-WhatsApp_Image_2025-12-17_at_6.34.06_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136469630-WhatsApp_Image_2025-12-17_at_6.34.06_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136469865-WhatsApp_Image_2025-12-17_at_6.34.13_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136470020-WhatsApp_Image_2025-12-17_at_6.34.13_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136470151-WhatsApp_Image_2025-12-17_at_6.34.13_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136470346-WhatsApp_Image_2025-12-17_at_6.34.14_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136470489-WhatsApp_Image_2025-12-17_at_6.34.14_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136470627-WhatsApp_Image_2025-12-17_at_6.34.15_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136470833-WhatsApp_Image_2025-12-17_at_6.34.15_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136471080-WhatsApp_Image_2025-12-17_at_6.34.15_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136471277-WhatsApp_Image_2025-12-17_at_6.34.25_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136471463-WhatsApp_Image_2025-12-17_at_6.34.26_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136471610-WhatsApp_Image_2025-12-17_at_6.34.36_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136471783-WhatsApp_Image_2025-12-17_at_6.34.36_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136471943-WhatsApp_Image_2025-12-17_at_6.34.37_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136472150-WhatsApp_Image_2025-12-17_at_6.34.38_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136472794-WhatsApp_Image_2025-12-17_at_6.34.38_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136472967-WhatsApp_Image_2025-12-17_at_6.34.38_PM_(3).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136473223-WhatsApp_Image_2025-12-17_at_6.34.38_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136474274-WhatsApp_Image_2025-12-17_at_6.34.39_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136474403-WhatsApp_Image_2025-12-17_at_6.34.39_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136474540-WhatsApp_Image_2025-12-17_at_6.34.39_PM_(3).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136474715-WhatsApp_Image_2025-12-17_at_6.34.39_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136475052-WhatsApp_Image_2025-12-17_at_6.34.40_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136475241-WhatsApp_Image_2025-12-17_at_6.34.40_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136475528-WhatsApp_Image_2025-12-17_at_6.34.40_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136475797-WhatsApp_Image_2025-12-17_at_6.34.41_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136476112-WhatsApp_Image_2025-12-17_at_6.34.41_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136476314-WhatsApp_Image_2025-12-17_at_6.34.41_PM_(3).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136476497-WhatsApp_Image_2025-12-17_at_6.34.41_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136476676-WhatsApp_Image_2025-12-17_at_6.34.42_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136476838-WhatsApp_Image_2025-12-17_at_6.34.42_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136477082-WhatsApp_Image_2025-12-17_at_6.34.42_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2162/1766136477301-WhatsApp_Image_2025-12-17_at_6.34.43_PM.jpeg`
      ]
    }

    // WhatsApp gallery for HR 38 W 2263 - use all Supabase media for this truck
    if (truck.name === 'HR 38 W 2263') {
      return [
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136482760-WhatsApp_Image_2025-12-17_at_6.44.37_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136483955-WhatsApp_Image_2025-12-17_at_6.44.38_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136484159-WhatsApp_Image_2025-12-17_at_6.44.38_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136484361-WhatsApp_Image_2025-12-17_at_6.44.38_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136484568-WhatsApp_Image_2025-12-17_at_6.44.39_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136484778-WhatsApp_Image_2025-12-17_at_6.44.39_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136484950-WhatsApp_Image_2025-12-17_at_6.44.39_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136485314-WhatsApp_Image_2025-12-17_at_6.44.40_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136485481-WhatsApp_Image_2025-12-17_at_6.44.40_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136485724-WhatsApp_Image_2025-12-17_at_6.44.40_PM_(3).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136485947-WhatsApp_Image_2025-12-17_at_6.44.40_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136486076-WhatsApp_Image_2025-12-17_at_6.44.41_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136486262-WhatsApp_Image_2025-12-17_at_6.44.41_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136486541-WhatsApp_Image_2025-12-17_at_6.44.41_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136486712-WhatsApp_Image_2025-12-17_at_6.44.42_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136486854-WhatsApp_Image_2025-12-17_at_6.44.42_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136487033-WhatsApp_Image_2025-12-17_at_6.44.42_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136487137-WhatsApp_Image_2025-12-17_at_6.44.43_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136487286-WhatsApp_Image_2025-12-17_at_6.44.43_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136487478-WhatsApp_Image_2025-12-17_at_6.44.43_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136487634-WhatsApp_Image_2025-12-17_at_6.44.44_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136487847-WhatsApp_Image_2025-12-17_at_6.44.44_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136488078-WhatsApp_Image_2025-12-17_at_6.44.44_PM_(3).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136488284-WhatsApp_Image_2025-12-17_at_6.44.44_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136488427-WhatsApp_Image_2025-12-17_at_6.44.45_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136488555-WhatsApp_Image_2025-12-17_at_6.44.45_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136488691-WhatsApp_Image_2025-12-17_at_6.44.45_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136489077-WhatsApp_Image_2025-12-17_at_6.44.46_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136489268-WhatsApp_Image_2025-12-17_at_6.44.46_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136489450-WhatsApp_Video_2025-12-17_at_6.44.46_PM_(1).mp4`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_2263/1766136492827-WhatsApp_Video_2025-12-17_at_6.44.46_PM.mp4`
      ]
    }

    // WhatsApp gallery for HR 38 W 3426 - use all Supabase media for this truck
    if (truck.name === 'HR 38 W 3426') {
      return [
        `${TRUCK_IMAGES_BASE}/HR_38_W_3426/1766136495219-WhatsApp_Image_2025-12-17_at_6.29.11_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_3426/1766136495466-WhatsApp_Image_2025-12-17_at_6.29.12_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_3426/1766136495613-WhatsApp_Image_2025-12-17_at_6.29.12_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_3426/1766136495852-WhatsApp_Image_2025-12-17_at_6.29.12_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_3426/1766136496243-WhatsApp_Image_2025-12-17_at_6.29.13_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_3426/1766136496410-WhatsApp_Image_2025-12-17_at_6.29.15_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_3426/1766136496546-WhatsApp_Image_2025-12-17_at_6.29.15_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_3426/1766136496761-WhatsApp_Image_2025-12-17_at_6.29.16_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_3426/1766136497204-WhatsApp_Image_2025-12-17_at_6.29.16_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_3426/1766136497393-WhatsApp_Image_2025-12-17_at_6.29.42_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_3426/1766136497595-WhatsApp_Image_2025-12-17_at_6.29.43_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_3426/1766136497795-WhatsApp_Image_2025-12-17_at_6.29.44_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_3426/1766136498019-WhatsApp_Image_2025-12-17_at_6.29.44_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_3426/1766136498160-WhatsApp_Image_2025-12-17_at_6.29.44_PM_(3).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_3426/1766136498291-WhatsApp_Image_2025-12-17_at_6.29.44_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_3426/1766136498466-WhatsApp_Image_2025-12-17_at_6.29.45_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_3426/1766136498600-WhatsApp_Image_2025-12-17_at_6.29.45_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_3426/1766136498804-WhatsApp_Image_2025-12-17_at_6.29.45_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_3426/1766136498950-WhatsApp_Image_2025-12-17_at_6.29.46_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_38_W_3426/1766136499098-WhatsApp_Image_2025-12-17_at_6.29.46_PM_(2).jpeg`
      ]
    }

    // WhatsApp gallery for HR 55 X 0025 - use all Supabase media for this truck
    if (truck.name === 'HR 55 X 0025') {
      return [
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136509027-WhatsApp_Image_2025-12-17_at_6.39.46_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136509297-WhatsApp_Image_2025-12-17_at_6.39.46_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136509468-WhatsApp_Image_2025-12-17_at_6.39.47_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136509685-WhatsApp_Image_2025-12-17_at_6.39.48_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136509917-WhatsApp_Image_2025-12-17_at_6.39.48_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136510078-WhatsApp_Image_2025-12-17_at_6.39.49_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136510231-WhatsApp_Image_2025-12-17_at_6.39.49_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136510390-WhatsApp_Image_2025-12-17_at_6.39.49_PM_(3).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136510534-WhatsApp_Image_2025-12-17_at_6.39.49_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136510781-WhatsApp_Image_2025-12-17_at_6.39.55_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136510941-WhatsApp_Image_2025-12-17_at_6.40.04_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136511079-WhatsApp_Image_2025-12-17_at_6.40.04_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136511268-WhatsApp_Image_2025-12-17_at_6.40.05_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136511398-WhatsApp_Image_2025-12-17_at_6.40.05_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136511595-WhatsApp_Image_2025-12-17_at_6.40.05_PM_(3).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136511802-WhatsApp_Image_2025-12-17_at_6.40.05_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136511961-WhatsApp_Image_2025-12-17_at_6.40.10_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136512136-WhatsApp_Image_2025-12-17_at_6.40.11_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136512269-WhatsApp_Image_2025-12-17_at_6.40.11_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136512431-WhatsApp_Image_2025-12-17_at_6.40.11_PM_(3).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136512596-WhatsApp_Image_2025-12-17_at_6.40.11_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136512726-WhatsApp_Image_2025-12-17_at_6.40.12_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136512909-WhatsApp_Image_2025-12-17_at_6.40.12_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136513060-WhatsApp_Image_2025-12-17_at_6.40.12_PM_(3).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136513221-WhatsApp_Image_2025-12-17_at_6.40.12_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136513817-WhatsApp_Image_2025-12-17_at_6.40.14_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136513976-WhatsApp_Image_2025-12-17_at_6.40.14_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136514116-WhatsApp_Image_2025-12-17_at_6.40.14_PM_(3).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136514469-WhatsApp_Image_2025-12-17_at_6.40.14_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136514647-WhatsApp_Image_2025-12-17_at_6.40.15_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136514798-WhatsApp_Image_2025-12-17_at_6.40.15_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136514957-WhatsApp_Image_2025-12-17_at_6.40.15_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136515143-WhatsApp_Video_2025-12-17_at_6.39.59_PM.mp4`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0025/1766136517077-WhatsApp_Video_2025-12-17_at_6.40.10_PM.mp4`
      ]
    }

    // WhatsApp gallery for HR 55 X 0253 - use all Supabase media for this truck
    if (truck.name === 'HR 55 X 0253') {
      return [
        `${TRUCK_IMAGES_BASE}/HR_55_X_0253/1766136519386-WhatsApp_Image_2025-12-17_at_6.51.02_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0253/1766136519820-WhatsApp_Image_2025-12-17_at_6.51.10_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0253/1766136520046-WhatsApp_Image_2025-12-17_at_6.51.19_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0253/1766136520268-WhatsApp_Image_2025-12-17_at_6.51.27_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0253/1766136520515-WhatsApp_Image_2025-12-17_at_6.51.33_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0253/1766136520669-WhatsApp_Image_2025-12-17_at_6.51.35_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0253/1766136520941-WhatsApp_Image_2025-12-17_at_6.51.40_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0253/1766136521128-WhatsApp_Image_2025-12-17_at_6.51.41_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0253/1766136521340-WhatsApp_Image_2025-12-17_at_6.51.42_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0253/1766136521584-WhatsApp_Image_2025-12-17_at_6.51.51_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0253/1766136521763-WhatsApp_Image_2025-12-17_at_6.51.52_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0253/1766136521981-WhatsApp_Image_2025-12-17_at_6.51.52_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0253/1766136522165-WhatsApp_Image_2025-12-17_at_6.51.53_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0253/1766136522323-WhatsApp_Image_2025-12-17_at_6.51.54_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0253/1766136522640-WhatsApp_Image_2025-12-17_at_6.51.54_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0253/1766136522818-WhatsApp_Image_2025-12-17_at_6.52.01_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0253/1766136523026-WhatsApp_Video_2025-12-17_at_6.52.12_PM.mp4`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0253/1766136523437-WhatsApp_Video_2025-12-17_at_6.52.17_PM_(1).mp4`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0253/1766136525095-WhatsApp_Video_2025-12-17_at_6.52.17_PM.mp4`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0253/1766136525445-WhatsApp_Video_2025-12-17_at_6.52.22_PM.mp4`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0253/1766136527304-WhatsApp_Video_2025-12-17_at_6.52.28_PM_(1).mp4`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_0253/1766136530160-WhatsApp_Video_2025-12-17_at_6.52.28_PM.mp4`
      ]
    }

    // WhatsApp gallery for HR 55 X 1147 - use all Supabase media for this truck
    if (truck.name === 'HR 55 X 1147') {
      return [
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136532086-WhatsApp_Image_2025-12-17_at_6.15.12_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136532228-WhatsApp_Image_2025-12-17_at_6.15.12_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136532497-WhatsApp_Image_2025-12-17_at_6.15.12_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136532777-WhatsApp_Image_2025-12-17_at_6.15.13_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136533032-WhatsApp_Image_2025-12-17_at_6.15.13_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136533268-WhatsApp_Image_2025-12-17_at_6.15.13_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136534238-WhatsApp_Image_2025-12-17_at_6.15.14_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136534427-WhatsApp_Image_2025-12-17_at_6.15.15_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136534655-WhatsApp_Image_2025-12-17_at_6.15.15_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136534834-WhatsApp_Image_2025-12-17_at_6.15.16_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136535075-WhatsApp_Image_2025-12-17_at_6.15.16_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136535229-WhatsApp_Image_2025-12-17_at_6.15.16_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136535417-WhatsApp_Image_2025-12-17_at_6.15.22_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136535578-WhatsApp_Image_2025-12-17_at_6.15.23_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136535706-WhatsApp_Image_2025-12-17_at_6.15.23_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136535842-WhatsApp_Image_2025-12-17_at_6.15.23_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136535997-WhatsApp_Image_2025-12-17_at_6.15.24_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136536135-WhatsApp_Image_2025-12-17_at_6.15.24_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136536268-WhatsApp_Image_2025-12-17_at_6.15.24_PM_(3).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136536468-WhatsApp_Image_2025-12-17_at_6.15.24_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136536605-WhatsApp_Image_2025-12-17_at_6.15.25_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136536775-WhatsApp_Image_2025-12-17_at_6.15.45_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136536908-WhatsApp_Image_2025-12-17_at_6.15.45_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136537041-WhatsApp_Image_2025-12-17_at_6.15.45_PM_(3).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136537262-WhatsApp_Image_2025-12-17_at_6.15.45_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136537406-WhatsApp_Image_2025-12-17_at_6.15.46_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136537558-WhatsApp_Image_2025-12-17_at_6.15.46_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136537718-WhatsApp_Image_2025-12-17_at_6.15.47_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136537912-WhatsApp_Image_2025-12-17_at_6.15.47_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136538052-WhatsApp_Image_2025-12-17_at_6.15.47_PM_(3).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136538204-WhatsApp_Image_2025-12-17_at_6.15.47_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136538338-WhatsApp_Image_2025-12-17_at_6.15.49_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136538517-WhatsApp_Image_2025-12-17_at_6.15.49_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136538720-WhatsApp_Image_2025-12-17_at_6.15.49_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136538860-WhatsApp_Image_2025-12-17_at_6.15.50_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136539048-WhatsApp_Image_2025-12-17_at_6.15.52_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136539184-WhatsApp_Image_2025-12-17_at_6.15.52_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136539331-WhatsApp_Image_2025-12-17_at_6.16.22_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136539483-WhatsApp_Image_2025-12-17_at_6.16.22_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136539624-WhatsApp_Image_2025-12-17_at_6.16.22_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136539806-WhatsApp_Image_2025-12-17_at_6.16.23_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136539806-WhatsApp_Image_2025-12-17_at_6.16.23_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136549048-WhatsApp_Video_2025-12-17_at_6.15.22_PM.mp4`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136552048-WhatsApp_Video_2025-12-17_at_6.15.37_PM.mp4`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136557048-WhatsApp_Video_2025-12-17_at_6.15.46_PM.mp4`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_1147/1766136562048-WhatsApp_Video_2025-12-17_at_6.16.22_PM.mp4`
      ]
    }

    // WhatsApp gallery for HR 55 X 2071 - use all Supabase media for this truck
    if (truck.name === 'HR 55 X 2071') {
      return [
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136554735-WhatsApp_Image_2025-12-17_at_6.01.40_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136554945-WhatsApp_Image_2025-12-17_at_6.01.40_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136555111-WhatsApp_Image_2025-12-17_at_6.01.41_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136555321-WhatsApp_Image_2025-12-17_at_6.01.41_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136555497-WhatsApp_Image_2025-12-17_at_6.01.42_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136555687-WhatsApp_Image_2025-12-17_at_6.01.42_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136555915-WhatsApp_Image_2025-12-17_at_6.01.43_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136556075-WhatsApp_Image_2025-12-17_at_6.01.43_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136556219-WhatsApp_Image_2025-12-17_at_6.02.01_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136556433-WhatsApp_Image_2025-12-17_at_6.02.01_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136556652-WhatsApp_Image_2025-12-17_at_6.02.02_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136556826-WhatsApp_Image_2025-12-17_at_6.02.02_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136556981-WhatsApp_Image_2025-12-17_at_6.02.02_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136557156-WhatsApp_Image_2025-12-17_at_6.02.03_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136557357-WhatsApp_Image_2025-12-17_at_6.02.06_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136557566-WhatsApp_Image_2025-12-17_at_6.02.06_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136557813-WhatsApp_Image_2025-12-17_at_6.02.06_PM_(3).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136558030-WhatsApp_Image_2025-12-17_at_6.02.06_PM_(4).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136558275-WhatsApp_Image_2025-12-17_at_6.02.06_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136558412-WhatsApp_Image_2025-12-17_at_6.02.07_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136558574-WhatsApp_Image_2025-12-17_at_6.02.07_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136558747-WhatsApp_Image_2025-12-17_at_6.02.08_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136558956-WhatsApp_Image_2025-12-17_at_6.02.08_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136559088-WhatsApp_Image_2025-12-17_at_6.02.16_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136559327-WhatsApp_Image_2025-12-17_at_6.02.16_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136559559-WhatsApp_Image_2025-12-17_at_6.03.12_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136559765-WhatsApp_Image_2025-12-17_at_6.03.12_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136559964-WhatsApp_Image_2025-12-17_at_6.03.20_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136560102-WhatsApp_Video_2025-12-17_at_6.02.01_PM.mp4`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136562399-WhatsApp_Video_2025-12-17_at_6.02.05_PM.mp4`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136565382-WhatsApp_Video_2025-12-17_at_6.03.11_PM.mp4`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_2071/1766136571544-WhatsApp_Video_2025-12-17_at_6.03.16_PM.mp4`
      ]
    }

    // WhatsApp gallery for HR 55 X 4498 - use all Supabase media for this truck
    if (truck.name === 'HR 55 X 4498') {
      return [
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136582714-WhatsApp_Image_2025-12-17_at_6.22.57_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136582936-WhatsApp_Image_2025-12-17_at_6.22.58_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136583164-WhatsApp_Image_2025-12-17_at_6.22.58_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136583409-WhatsApp_Image_2025-12-17_at_6.22.58_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136583580-WhatsApp_Image_2025-12-17_at_6.22.59_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136584035-WhatsApp_Image_2025-12-17_at_6.22.59_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136584237-WhatsApp_Image_2025-12-17_at_6.22.59_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136584466-WhatsApp_Image_2025-12-17_at_6.23.00_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136584630-WhatsApp_Image_2025-12-17_at_6.23.00_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136584852-WhatsApp_Image_2025-12-17_at_6.23.06_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136584999-WhatsApp_Image_2025-12-17_at_6.23.06_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136585210-WhatsApp_Image_2025-12-17_at_6.23.07_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136585422-WhatsApp_Image_2025-12-17_at_6.23.07_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136585551-WhatsApp_Image_2025-12-17_at_6.23.13_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136585713-WhatsApp_Image_2025-12-17_at_6.23.21_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136585961-WhatsApp_Image_2025-12-17_at_6.23.21_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136586163-WhatsApp_Image_2025-12-17_at_6.23.21_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136586290-WhatsApp_Image_2025-12-17_at_6.23.22_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136586521-WhatsApp_Image_2025-12-17_at_6.23.22_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136586711-WhatsApp_Image_2025-12-17_at_6.23.22_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136586856-WhatsApp_Image_2025-12-17_at_6.23.28_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136587032-WhatsApp_Image_2025-12-17_at_6.23.28_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136587211-WhatsApp_Image_2025-12-17_at_6.23.29_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136587330-WhatsApp_Image_2025-12-17_at_6.23.29_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136587474-WhatsApp_Image_2025-12-17_at_6.23.29_PM_(3).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136587629-WhatsApp_Image_2025-12-17_at_6.23.29_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136587844-WhatsApp_Image_2025-12-17_at_6.23.30_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136587985-WhatsApp_Image_2025-12-17_at_6.23.30_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136588274-WhatsApp_Image_2025-12-17_at_6.23.30_PM_(3).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136588398-WhatsApp_Image_2025-12-17_at_6.23.30_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136588536-WhatsApp_Image_2025-12-17_at_6.23.31_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136588697-WhatsApp_Image_2025-12-17_at_6.23.31_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136588880-WhatsApp_Image_2025-12-17_at_6.23.31_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136588996-WhatsApp_Image_2025-12-17_at_6.23.32_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136589149-WhatsApp_Image_2025-12-17_at_6.23.32_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136589304-WhatsApp_Image_2025-12-17_at_6.23.32_PM_(3).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136589496-WhatsApp_Image_2025-12-17_at_6.23.32_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136589836-WhatsApp_Image_2025-12-17_at_6.23.33_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136590247-WhatsApp_Image_2025-12-17_at_6.23.33_PM_(2).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136590457-WhatsApp_Image_2025-12-17_at_6.23.33_PM_(3).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136590583-WhatsApp_Image_2025-12-17_at_6.23.33_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136590703-WhatsApp_Image_2025-12-17_at_6.23.34_PM_(1).jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136590863-WhatsApp_Image_2025-12-17_at_6.23.34_PM.jpeg`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136591010-WhatsApp_Video_2025-12-17_at_6.23.20_PM.mp4`,
        `${TRUCK_IMAGES_BASE}/HR_55_X_4498/1766136594452-WhatsApp_Video_2025-12-17_at_6.23.25_PM.mp4`
      ]
    }

    // Special handling for Eicher PRO 2110 - use all 4 images
    if (truck.manufacturer === 'Eicher Motors' && truck.model?.includes('PRO 2110')) {
      return [
        '/trucks/eicher-truck-1.webp',
        '/trucks/eicher-truck-2.webp',
        '/trucks/eicher-truck-3.webp',
        '/trucks/eicher-truck-4.webp'
      ]
    }
    
    // Special handling for Truck 3 (Eicher 1059 Xp) - use only truck photos (excluding info screenshot)
    if (truck.manufacturer === 'Eicher Motors' && truck.model === '1059 Xp') {
      return [
        '/trucks/truck3-image-2.png',
        '/trucks/truck3-image-3.png',
        '/trucks/truck3-image-4.png',
        '/trucks/truck3-image-5.png'
      ]
    }
    
    // Special handling for Truck 4 (Tata 1512 LPT) - use only truck photos (excluding info screenshot)
    if (truck.manufacturer === 'Tata Motors' && truck.model === '1512 LPT') {
      return [
        '/trucks/truck4-image-1.png',
        '/trucks/truck4-image-3.jpeg',
        '/trucks/truck4-image-4.jpeg'
      ]
    }
    
    // Special handling for Truck 5 (Eicher Pro 3015) - use only truck photos (excluding info screenshot)
    if (truck.manufacturer === 'Eicher Motors' && truck.model === 'Pro 3015') {
      return [
        '/trucks/truck5-image-2.png',
        '/trucks/truck5-image-3.png',
        '/trucks/truck5-image-4.png',
        '/trucks/truck5-image-5.png',
        '/trucks/truck5-image-6.png',
        '/trucks/truck5-image-7.png'
      ]
    }
    
    // Special handling for Truck 6 (Eicher Pro 3019) - use only truck photos (excluding info screenshot)
    if (truck.manufacturer === 'Eicher Motors' && truck.model === 'Pro 3019') {
      return [
        '/trucks/truck6-image-2.jpg',
        '/trucks/truck6-image-3.jpg',
        '/trucks/truck6-image-4.jpg',
        '/trucks/truck6-image-5.jpg'
      ]
    }
    
    // Special handling for Truck 7 (Tata 3518) - use only truck photos (excluding info screenshot)
    if (truck.manufacturer === 'Tata Motors' && truck.model === '3518') {
      return [
        '/trucks/truck7-image-2.png',
        '/trucks/truck7-image-3.png',
        '/trucks/truck7-image-4.png',
        '/trucks/truck7-image-5.png'
      ]
    }
    
    // Special handling for Truck 8 (Eicher PRO 2110 - second one) - use all 5 images
    if (truck.imageUrl?.includes('truck8-image-1.png')) {
      return [
        '/trucks/truck8-image-1.png',
        '/trucks/truck8-image-2.png',
        '/trucks/truck8-image-3.png',
        '/trucks/truck8-image-4.png',
        '/trucks/truck8-image-5.png'
      ]
    }
    
    // Special handling for Truck 9 (Tata Truck) - use only truck photos (excluding info screenshot)
    if (truck.imageUrl?.includes('truck9-image-1.png')) {
      return [
        '/trucks/truck9-image-1.png',
        '/trucks/truck9-image-2.png',
        '/trucks/truck9-image-3.png',
        '/trucks/truck9-image-4.png',
        '/trucks/truck9-image-5.png'
      ]
    }
    
    // Special handling for Truck 10 (Tata LPT-1109-HEX2) - use only truck photos (excluding info screenshot)
    if (truck.manufacturer === 'Tata Motors' && truck.model === 'LPT-1109-HEX2') {
      return [
        '/trucks/truck10-image-1.jpg',
        '/trucks/truck10-image-2.jpg',
        '/trucks/truck10-image-3.jpg'
      ]
    }
    
    // Special handling for Truck 11 (Eicher Truck) - use only truck photos (excluding info screenshot)
    if (truck.imageUrl?.includes('truck11-image-1.png')) {
      return [
        '/trucks/truck11-image-1.png',
        '/trucks/truck11-image-2.png',
        '/trucks/truck11-image-3.png'
      ]
    }
    
    // Special handling for Truck 12 (Tata LPT-3118) - use only truck photos (excluding info screenshot)
    if (truck.manufacturer === 'Tata Motors' && truck.model === 'LPT-3118') {
      return [
        '/trucks/truck12-image-1.png',
        '/trucks/truck12-image-2.png',
        '/trucks/truck12-image-3.png',
        '/trucks/truck12-image-4.png'
      ]
    }
    
    // Special handling for Truck 13 (Eicher Truck) - use only truck photos (excluding info screenshot)
    if (truck.imageUrl?.includes('truck13-image-1.png')) {
      return [
        '/trucks/truck13-image-1.png',
        '/trucks/truck13-image-2.png',
        '/trucks/truck13-image-3.png',
        '/trucks/truck13-image-4.png',
        '/trucks/truck13-image-5.png'
      ]
    }
    
    // Special handling for Truck 14 (Ashok Leyland Partner 1114) - use only truck photos (excluding info screenshot)
    if (truck.manufacturer === 'Ashok Leyland' && truck.model === 'Partner 1114') {
      return [
        '/trucks/truck14-image-1.png',
        '/trucks/truck14-image-2.png',
        '/trucks/truck14-image-3.png',
        '/trucks/truck14-image-4.png',
        '/trucks/truck14-image-5.png'
      ]
    }
    
    // Special handling for Truck 15 (Ashok Leyland 1615) - use only truck photos (excluding info screenshot)
    if (truck.manufacturer === 'Ashok Leyland' && truck.model === '1615') {
      return [
        '/trucks/truck15-image-1.png',
        '/trucks/truck15-image-2.png',
        '/trucks/truck15-image-3.png',
        '/trucks/truck15-image-4.png',
        '/trucks/truck15-image-5.png',
        '/trucks/truck15-image-6.png'
      ]
    }
    
    // Special handling for Truck 16 (Eicher PRO 2114 XP) - use only truck photos (excluding info screenshot)
    if (truck.manufacturer === 'Eicher Motors' && truck.model === 'PRO 2114 XP') {
      return [
        '/trucks/truck16-image-1.png',
        '/trucks/truck16-image-2.png',
        '/trucks/truck16-image-3.png',
        '/trucks/truck16-image-4.png',
        '/trucks/truck16-image-5.png'
      ]
    }
    
    // Special handling for Truck 17 (Ashok Leyland Ecomet 1214) - use only truck photos (excluding info screenshot)
    if (truck.manufacturer === 'Ashok Leyland' && truck.model === 'Ecomet 1214') {
      return [
        '/trucks/truck17-image-1.png',
        '/trucks/truck17-image-2.png',
        '/trucks/truck17-image-3.png',
        '/trucks/truck17-image-4.png'
      ]
    }
    
    // Special handling for Truck 18 (Eicher Pro 2059VD) - use all truck photos
    if (truck.manufacturer === 'Eicher Motors' && truck.model === 'Pro 2059VD') {
      return [
        '/trucks/truck18-image-1.png',
        '/trucks/truck18-image-2.png',
        '/trucks/truck18-image-3.png',
        '/trucks/truck18-image-4.png',
        '/trucks/truck18-image-5.png'
      ]
    }
    
    // Special handling for Truck 19 (Eicher Pro 2118) - use all truck photos
    if (truck.manufacturer === 'Eicher Motors' && truck.model === 'Pro 2118') {
      return [
        '/trucks/truck19-image-1.png',
        '/trucks/truck19-image-2.png',
        '/trucks/truck19-image-3.png',
        '/trucks/truck19-image-4.png',
        '/trucks/truck19-image-5.png',
        '/trucks/truck19-image-6.png',
        '/trucks/truck19-image-7.png',
        '/trucks/truck19-image-8.png'
      ]
    }
    
    // Special handling for Truck 20 (Tata 1613 CRi6) - use only truck photos (excluding info screenshot)
    if (truck.manufacturer === 'Tata Motors' && truck.model === '1613 CRi6') {
      return [
        '/trucks/truck20-image-1.png',
        '/trucks/truck20-image-2.png',
        '/trucks/truck20-image-3.png',
        '/trucks/truck20-image-4.png'
      ]
    }
    
    // Special handling for Truck 21 (Eicher Pro 2059XP) - use fetched images if available, otherwise fallback
    if (truck.manufacturer === 'Eicher Motors' && truck.model === 'Pro 2059XP') {
      if (fetchedImages.length > 0) {
        return fetchedImages
      }
      return [
        '/trucks/truck21-image-1.png',
        '/trucks/truck21-image-2.png',
        '/trucks/truck21-image-3.png',
        '/trucks/truck21-image-4.png',
        '/trucks/truck21-image-5.png'
      ]
    }
    
    // Special handling for Tata 709g LPT - fetch from API
    // Check this BEFORE the hardcoded Truck 29 check so fetched images take priority
    const isTata709gLPT = (truckName.toLowerCase().includes('709g') || truckName.toLowerCase().includes('709 g')) && 
                         truckName.toLowerCase().includes('lpt') && 
                         (truckName.toLowerCase().includes('tata') || 
                          (truck.manufacturer === 'Tata Motors' && truck.model?.toLowerCase().includes('709')))
    
    if (isTata709gLPT) {
      if (fetchedImages.length > 0) {
        console.log(`[getGalleryImages] Returning ${fetchedImages.length} fetched images for Tata 709g LPT`)
        return fetchedImages
      } else {
        // If we're waiting for images to load, return main image as fallback
        // This prevents showing hardcoded images that might not exist
        console.warn(`[getGalleryImages] No fetched images yet for Tata 709g LPT (truckName: "${truckName}"), using main image`)
        // Return main image repeated until fetched images load
        return truck.imageUrl ? [truck.imageUrl] : []
      }
    }
    
    // Special handling for Tata 609g - fetch from API
    const isTata609g = (truckName.toLowerCase().includes('609g') || truckName.toLowerCase().includes('609 g')) && 
                       (truckName.toLowerCase().includes('tata') || 
                        (truck.manufacturer === 'Tata Motors' && truck.model?.toLowerCase().includes('609')))
    
    if (isTata609g && fetchedImages.length > 0) {
      return fetchedImages
    }
    
    // Special handling for Eicher Pro 1075 F HSD - fetch from API
    const isEicher1075HSD = truckName.toLowerCase().includes('1075') && 
                           truckName.toLowerCase().includes('hsd') && 
                           (truckName.toLowerCase().includes('eicher') || 
                            (truck.manufacturer === 'Eicher Motors' && truck.model?.toLowerCase().includes('1075')))
    
    if (isEicher1075HSD && fetchedImages.length > 0) {
      return fetchedImages
    }
    
    // Special handling for Eicher 2059XP - fetch from API (general case)
    const isEicher2059XP = truckName.toLowerCase().includes('2059') && 
                           (truckName.toLowerCase().includes('eicher') || 
                            (truck.manufacturer === 'Eicher Motors' && truck.model?.toLowerCase().includes('2059')))
    
    if (isEicher2059XP && fetchedImages.length > 0) {
      return fetchedImages
    }
    
    // Special handling for Truck 22 (Tata Truck) - use all truck photos
    if (truck.imageUrl?.includes('truck22-image-1.png')) {
      return [
        '/trucks/truck22-image-1.png',
        '/trucks/truck22-image-2.png',
        '/trucks/truck22-image-3.png',
        '/trucks/truck22-image-4.png'
      ]
    }
    
    // Special handling for Truck 23 (Ashok Leyland Pick-up) - use only truck photos (excluding info screenshot)
    if (truck.manufacturer === 'Ashok Leyland' && truck.model === 'Pick-up') {
      return [
        '/trucks/truck23-image-1.png',
        '/trucks/truck23-image-2.png',
        '/trucks/truck23-image-3.png',
        '/trucks/truck23-image-4.png',
        '/trucks/truck23-image-5.png',
        '/trucks/truck23-image-6.png'
      ]
    }
    
    // Special handling for Truck 24 (Eicher Truck) - use only truck photos (excluding info screenshot)
    if (truck.imageUrl?.includes('truck24-image-1.png')) {
      return [
        '/trucks/truck24-image-1.png',
        '/trucks/truck24-image-2.png',
        '/trucks/truck24-image-3.png',
        '/trucks/truck24-image-4.png',
        '/trucks/truck24-image-5.png',
        '/trucks/truck24-image-6.png'
      ]
    }
    
    // Special handling for Truck 25 (SML Isuzu Truck) - use only truck photos (excluding info screenshot)
    if (truck.manufacturer === 'SML Isuzu' && truck.model === 'Truck') {
      return [
        '/trucks/truck25-image-1.png',
        '/trucks/truck25-image-2.png',
        '/trucks/truck25-image-3.png',
        '/trucks/truck25-image-4.png',
        '/trucks/truck25-image-5.png'
      ]
    }
    
    // Special handling for Truck 26 (Eicher 2059) - use only truck photos (excluding info screenshot)
    if (truck.manufacturer === 'Eicher Motors' && truck.model === '2059' && truck.year === 2021 && truck.kilometers === 52000) {
      return [
        '/trucks/truck26-image-1.png',
        '/trucks/truck26-image-2.png',
        '/trucks/truck26-image-3.png',
        '/trucks/truck26-image-4.png'
      ]
    }
    
    // Special handling for Truck 27 (Eicher 2059 xp) - use only truck photos (excluding info screenshot)
    if (truck.manufacturer === 'Eicher Motors' && truck.model === '2059 xp' && truck.year === 2022 && truck.kilometers === 72000) {
      return [
        '/trucks/truck27-image-1.png',
        '/trucks/truck27-image-2.png',
        '/trucks/truck27-image-3.png',
        '/trucks/truck27-image-4.png'
      ]
    }
    
    // Special handling for Truck 28 (Tata 709 LPT) - use only truck photos (excluding info screenshot)
    if (truck.manufacturer === 'Tata Motors' && truck.model === '709 LPT' && truck.year === 2021 && truck.kilometers === 87000) {
      return [
        '/trucks/truck28-image-1.png',
        '/trucks/truck28-image-2.png',
        '/trucks/truck28-image-3.png'
      ]
    }
    
    // Special handling for Truck 29 (Tata 709 G LPT) - prioritize fetched images from API
    // This check should only apply if we haven't already handled it above with the general check
    // Note: This is a more specific check (exact year/km match) so it can override the general check
    if (truck.manufacturer === 'Tata Motors' && truck.model === '709 G LPT' && truck.year === 2022 && truck.kilometers === 83900) {
      // Always check for fetched images first (from API) - these take absolute priority
      if (fetchedImages.length > 0) {
        console.log(`[Truck 29] Using ${fetchedImages.length} fetched images from API`)
        return fetchedImages
      }
      // If no fetched images, check if this was already handled by the general check above
      // If so, we already returned the main image, so don't return hardcoded images
      // Only return hardcoded images if this is a different truck (shouldn't happen, but safety check)
      if (!isTata709gLPT) {
        console.log(`[Truck 29] No fetched images and not handled by general check, using hardcoded fallback`)
        return [
          '/trucks/truck29-image-1.png',
          '/trucks/truck29-image-2.png',
          '/trucks/truck29-image-3.png',
          '/trucks/truck29-image-4.png'
        ]
      }
      // If it was handled by general check, we already returned main image above
      // Don't return anything here to avoid duplicate
    }
    
    // Special handling for Truck 30 (Tata 1109 G LPT) - use only truck photos (excluding info screenshot)
    if (truck.manufacturer === 'Tata Motors' && truck.model === '1109 G LPT' && truck.year === 2020 && truck.kilometers === 87000) {
      return [
        '/trucks/truck30-image-1.png',
        '/trucks/truck30-image-2.png',
        '/trucks/truck30-image-3.png'
      ]
    }
    
    // Special handling for Truck 31 (Tata 1512 LPT) - use only truck photos (excluding info screenshot)
    if (truck.manufacturer === 'Tata Motors' && truck.model === '1512 LPT' && truck.year === 2022 && truck.kilometers === 73000) {
      return [
        '/trucks/truck31-image-1.png',
        '/trucks/truck31-image-2.png',
        '/trucks/truck31-image-3.png',
        '/trucks/truck31-image-4.png',
        '/trucks/truck31-image-5.png',
        '/trucks/truck31-image-6.png'
      ]
    }
    
    // For Tata 709g LPT trucks, check if we have fetched images (final fallback)
    const isTata709gLPTFinal = (truckName.toLowerCase().includes('709g') || truckName.toLowerCase().includes('709 g')) && 
                               truckName.toLowerCase().includes('lpt') && 
                               (truckName.toLowerCase().includes('tata') || 
                                (truck.manufacturer === 'Tata Motors' && truck.model?.toLowerCase().includes('709')))
    
    if (isTata709gLPTFinal && fetchedImages.length > 0) {
      return fetchedImages
    }
    
    // For Tata 609g trucks, check if we have fetched images (final fallback)
    const isTata609gFinal = (truckName.toLowerCase().includes('609g') || truckName.toLowerCase().includes('609 g')) && 
                           (truckName.toLowerCase().includes('tata') || 
                            (truck.manufacturer === 'Tata Motors' && truck.model?.toLowerCase().includes('609')))
    
    if (isTata609gFinal && fetchedImages.length > 0) {
      return fetchedImages
    }
    
    // For Eicher Pro 1075 F HSD trucks, check if we have fetched images (final fallback)
    const isEicher1075HSDFinal = truckName.toLowerCase().includes('1075') && 
                                 truckName.toLowerCase().includes('hsd') && 
                                 (truckName.toLowerCase().includes('eicher') || 
                                  (truck.manufacturer === 'Eicher Motors' && truck.model?.toLowerCase().includes('1075')))
    
    if (isEicher1075HSDFinal && fetchedImages.length > 0) {
      return fetchedImages
    }
    
    // For Eicher 2059XP trucks, check if we have fetched images (final fallback)
    const isEicher2059XPFinal = truckName.toLowerCase().includes('2059') && 
                                 (truckName.toLowerCase().includes('eicher') || 
                                  (truck.manufacturer === 'Eicher Motors' && truck.model?.toLowerCase().includes('2059')))
    
    if (isEicher2059XPFinal && fetchedImages.length > 0) {
      return fetchedImages
    }
    
    // Default: repeat the main image (but log a warning if we expected fetched images)
    const isTata609gDefault = (truckName.toLowerCase().includes('609') || truckName.toLowerCase().includes('609g') || truckName.toLowerCase().includes('609 g')) && 
                              (truckName.toLowerCase().includes('tata') || truck?.manufacturer === 'Tata Motors')
    
    if (isTata609gDefault && fetchedImages.length === 0) {
      console.warn(`[getGalleryImages] Tata 609g has no gallery images in storage; using main image fallback. (truck: "${truckName}")`)
    }
    
    // Default: only the main image (repeating it just renders the same photo N times)
    return [truck.imageUrl]
  }

  const effectivePrice = truck ? (
    tataAceGoldDisplay ? tataAceGoldDisplay.price
    : tataAceGoldPlainDisplay ? tataAceGoldPlainDisplay.price
    : tata1512GLPTDisplay ? tata1512GLPTDisplay.price
    : tata1212LPTDisplay ? tata1212LPTDisplay.price
    : tata609GDisplay ? tata609GDisplay.price
    : tata709gLPTDisplay ? tata709gLPTDisplay.price
    : tata1109gLPTDisplay ? tata1109gLPTDisplay.price
    : eicherPro2110LDisplay ? eicherPro2110LDisplay.price
    : bajajMaximaCNGDisplay ? bajajMaximaCNGDisplay.price
    : eicher2059XPDisplay ? eicher2059XPDisplay.price
    : eicher1075HSDDisplay ? eicher1075HSDDisplay.price
    : ashokLeyland1415Display ? ashokLeyland1415Display.price
    : mahindraBoleroDisplay ? mahindraBoleroDisplay.price
    : smlIsuzuZT54Display ? smlIsuzuZT54Display.price
    : parseFloat(truck.price)
  ) : 0
  const listPrice = truck ? effectivePrice * 1.08 : 0
  const savings = truck ? Math.round(effectivePrice * 0.08) : 0

  const toggleExpandItem = (key: string) => {
    setExpandedItems(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const shareVia = (method: string) => {
    const pageUrl = window.location.href
    const sharePrice = truck ? (
      tataAceGoldDisplay ? tataAceGoldDisplay.price
      : tataAceGoldPlainDisplay ? tataAceGoldPlainDisplay.price
      : tata1512GLPTDisplay ? tata1512GLPTDisplay.price
      : tata1212LPTDisplay ? tata1212LPTDisplay.price
      : tata609GDisplay ? tata609GDisplay.price
      : tata709gLPTDisplay ? tata709gLPTDisplay.price
      : tata1109gLPTDisplay ? tata1109gLPTDisplay.price
      : eicherPro2110LDisplay ? eicherPro2110LDisplay.price
      : bajajMaximaCNGDisplay ? bajajMaximaCNGDisplay.price
      : eicher2059XPDisplay ? eicher2059XPDisplay.price
      : eicher1075HSDDisplay ? eicher1075HSDDisplay.price
      : ashokLeyland1415Display ? ashokLeyland1415Display.price
      : mahindraBoleroDisplay ? mahindraBoleroDisplay.price
      : smlIsuzuZT54Display ? smlIsuzuZT54Display.price
      : truck.price
    ) : truck?.price
    const shareText = `Check out this ${truck?.name} - ${displayPrice(sharePrice)} on Axlerator`
    
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + pageUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`,
    }
    
    if (method === 'copy') {
      navigator.clipboard.writeText(pageUrl)
      alert('Link copied!')
    } else if (urls[method]) {
      window.open(urls[method], '_blank')
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 9) return '#059669'
    if (score >= 8) return '#2563eb'
    if (score >= 7) return '#d97706'
    return '#dc2626'
  }

  const handleViewFullReportClick = () => {
    if (!REPORT_OTP_ENABLED || hasVerifiedReportOTP) {
      setShowFullReport(true)
      return
    }
    setReportOTPError('')
    setReportOTPStep('phone')
    setShowReportOTPModal(true)
  }

  const handleSendReportOTP = async () => {
    if (!reportPhone || reportPhone.trim().length < 10) {
      setReportOTPError('Please enter a valid phone number')
      return
    }

    try {
      setReportOTPLoading(true)
      setReportOTPError('')

      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: reportPhone.trim(),
          purpose: 'report_view',
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setReportOTPError(data?.error || 'Failed to send OTP. Please try again.')
        return
      }

      setReportOTPStep('otp')
    } catch (error) {
      console.error('Error sending report OTP:', error)
      setReportOTPError('Failed to send OTP. Please try again.')
    } finally {
      setReportOTPLoading(false)
    }
  }

  const handleVerifyReportOTP = async () => {
    if (!reportOTP || reportOTP.trim().length !== 6) {
      setReportOTPError('Please enter the 6-digit OTP sent to your phone')
      return
    }

    try {
      setReportOTPLoading(true)
      setReportOTPError('')

      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: reportPhone.trim(),
          otp: reportOTP.trim(),
          purpose: 'report_view',
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data?.verified) {
        setReportOTPError(data?.error || 'Invalid OTP. Please try again.')
        return
      }

      setHasVerifiedReportOTP(true)
      setShowReportOTPModal(false)
      setShowFullReport(true)
    } catch (error) {
      console.error('Error verifying report OTP:', error)
      setReportOTPError('Failed to verify OTP. Please try again.')
    } finally {
      setReportOTPLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="truck-details-page">
        <Navbar />
        <div className="td-loading">
          <div className="td-spinner"></div>
          <p>Loading truck details...</p>
        </div>
      </div>
    )
  }

  if (!truck) {
    return (
      <div className="truck-details-page">
        <Navbar />
        <div className="td-error">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
          <h2>Vehicle Not Available</h2>
          <p>This truck may have been sold or is no longer listed.</p>
          <button onClick={() => router.push('/browse-trucks')} className="td-cta-btn">
            Explore Available Trucks
          </button>
        </div>
      </div>
    )
  }

  const gallery = getGalleryImages()
  // Index can outlive a shorter gallery (fallback list -> fetched list and back)
  const activeIndex = gallery.length > 0 ? Math.min(selectedImageIndex, gallery.length - 1) : 0

  // Load-capacity figures: legacy trucks carry hardcoded specs, everything else
  // reads its own trucks record.
  const dbGrossLoad = formatLoadCapacity((truck as any).payload_capacity_gross, 'kg')
  const dbNetLoad = formatLoadCapacity((truck as any).payload_capacity_net, 'kg')
  const dbBodyLength = formatLoadCapacity((truck as any).payload_capacity_ft, 'ft')
  const hasLegacyLoadFigures = Boolean(
    (isTata709gLPT && tata709gLPTDisplay) ||
    (isTata1109gLPT && tata1109gLPTDisplay) ||
    (isTata1212LPT && tata1212LPTDisplay) ||
    (isEicherPro2110L && eicherPro2110LDisplay) ||
    (isEicher2059XPTruck && eicher2059XPDisplay) ||
    (isEicher1075HSDTruck && eicher1075HSDDisplay) ||
    (isSmlIsuzuZT54 && smlIsuzuZT54Display) ||
    (isBajajMaximaCNG && bajajMaximaCNGDisplay) ||
    (isTata609G && tata609GDisplay) ||
    isAshokLeylandTruck || isAshokLeyland1615Truck || isTata1412Truck || isSmlIsuzuTruck ||
    isMahindraBoleroTruck || isTataAceGold7908 || isTataAceGoldPlain || isTata1512GLPT
  )
  const inspectionData = inspectionDataFromScores(truck?.quality_scores) ?? getInspectionData(truck?.name)
  const overallScore = (Object.values(inspectionData).reduce((acc, cat) => acc + cat.score, 0) / Object.keys(inspectionData).length).toFixed(1)

  return (
    <div className={`truck-details-page ${isVisible ? 'page-visible' : ''}`}>
      <Navbar />
      
      {/* Breadcrumb */}
      <nav className="td-breadcrumb">
        <div className="td-breadcrumb-inner">
          <Link href="/">Home</Link>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
          <Link href="/browse-trucks">Trucks</Link>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
          <Link href={`/browse-trucks?brand=${truck.manufacturer}`}>{truck.manufacturer}</Link>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
          <span>{isAshokLeyland1615Truck ? 'ASHOK LEYLAND ECOMET STAR 1615 HE' : truck.model}</span>
        </div>
      </nav>

      {/* Main Product Section */}
      <div className="td-product">
        {/* Gallery */}
        <div className="td-gallery">
          <div className="td-main-image">
            {(() => {
              const imageSrc = gallery[activeIndex] || '/placeholder.jpg'
              const isExternal = imageSrc?.includes('supabase.co') || imageSrc?.startsWith('http')

              if (isVideoUrl(imageSrc)) {
                if (videoErrors[imageSrc]) {
                  return (
                    <div className="td-video-fallback">
                      <span className="td-video-fallback-icon" aria-hidden="true">▶</span>
                      <p>This browser can&apos;t play this video.</p>
                      <a href={imageSrc} target="_blank" rel="noopener noreferrer">
                        Open video in a new tab
                      </a>
                    </div>
                  )
                }
                return (
                  <video
                    key={imageSrc}
                    src={imageSrc}
                    controls
                    playsInline
                    preload="metadata"
                    crossOrigin="anonymous"
                    onError={() => setVideoErrors(prev => ({ ...prev, [imageSrc]: true }))}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      background: '#000',
                    }}
                  />
                )
              }

              if (isExternal) {
                return (
                  <img
                    src={imageSrc}
                    alt={truck.name}
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    onClick={() => setLightboxOpen(true)}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      cursor: 'zoom-in'
                    }}
                    loading="eager"
                  />
                )
              }
              
              return (
                <Image
                  src={imageSrc}
                  alt={truck.name}
                  fill
                  onClick={() => setLightboxOpen(true)}
                  style={{ objectFit: 'cover', cursor: 'zoom-in' }}
                  priority
                />
              )
            })()}
            <button 
              className="td-nav-btn prev"
              onClick={() => setSelectedImageIndex(activeIndex > 0 ? activeIndex - 1 : gallery.length - 1)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <button 
              className="td-nav-btn next"
              onClick={() => setSelectedImageIndex(activeIndex < gallery.length - 1 ? activeIndex + 1 : 0)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
            <button
              className="td-expand-btn"
              onClick={() => setLightboxOpen(true)}
              aria-label="View full image"
              title="View full image"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              </svg>
            </button>
            {truck.certified && (
              <div className="td-certified-tag">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                Axlerator Assured
              </div>
            )}
            {gallery.length > 1 && (
              gallery.length <= 12 ? (
                <div className="td-image-dots">
                  {gallery.map((_, idx) => (
                    <button
                      key={idx}
                      className={`td-dot ${idx === activeIndex ? 'active' : ''}`}
                      onClick={() => setSelectedImageIndex(idx)}
                    />
                  ))}
                </div>
              ) : (
                <div className="td-image-counter">
                  {activeIndex + 1} / {gallery.length}
                </div>
              )
            )}
          </div>
          <div className="td-thumbs" ref={thumbStripRef}>
            {gallery.map((img, idx) => {
              return (
                <button
                  key={`${idx}-${img}`}
                  className={`td-thumb ${idx === activeIndex ? 'active' : ''}`}
                  onClick={() => setSelectedImageIndex(idx)}
                >
                  {(() => {
                    const isExternal = img?.includes('supabase.co') || img?.startsWith('http')

                    if (isVideoUrl(img)) {
                      return (
                        <>
                          {!videoErrors[img] && (
                          <video
                            src={img}
                            muted
                            playsInline
                            preload="metadata"
                            crossOrigin="anonymous"
                            onError={() => setVideoErrors(prev => ({ ...prev, [img]: true }))}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              background: '#000',
                            }}
                          />
                          )}
                          <span className="td-thumb-play" aria-hidden="true">▶</span>
                        </>
                      )
                    }

                    if (isExternal) {
                      return (
                        <img
                          src={img}
                          alt=""
                          loading="lazy"
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            position: 'absolute',
                            top: 0,
                            left: 0
                          }}
                        />
                      )
                    }
                    
                    return (
                      <Image
                        src={img}
                        alt=""
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    )
                  })()}
                </button>
              )
            })}
          </div>
        </div>

        {/* Product Info */}
        <div className="td-info">
          <div className="td-info-header">
            <div>
              <h1>{truck.name}</h1>
              {isAshokLeylandTruck ? (
                <div className="td-subtitle" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span>{truck.year}</span>
                  <span style={{ whiteSpace: 'nowrap' }}>Ashok Leyland CA1415/52 H CC G</span>
                  <span>{truck.horsepower} HP</span>
                </div>
              ) : isAshokLeyland1615Truck ? (
                <div className="td-subtitle" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span>{truck.year}</span>
                  <span style={{ whiteSpace: 'nowrap' }}>{truck.manufacturer} ASHOK LEYLAND ECOMET STAR 1615 HE</span>
                  <span>{truck.horsepower} HP</span>
                </div>
              ) : isTata1412Truck ? (
                <div className="td-subtitle" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span>{truck.year}</span>
                  <span style={{ whiteSpace: 'nowrap' }}>{truck.manufacturer} {truck.model}</span>
                  <span>{truck.horsepower} HP</span>
                </div>
              ) : isSmlIsuzuTruck ? (
                <div className="td-subtitle" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ whiteSpace: 'nowrap' }}>SAMRAT4760GSNGTCCABCHASSIS21F</span>
                  <span>{truck.horsepower} HP • CNG • Manual</span>
                </div>
              ) : isSmlIsuzuZT54 && smlIsuzuZT54Display ? (
                <div className="td-subtitle" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span>{smlIsuzuZT54Display.yearMonth} (YOM)</span>
                  <span style={{ whiteSpace: 'nowrap' }}>{smlIsuzuZT54Display.model}</span>
                  <span>{smlIsuzuZT54Display.powerDisplay} • Diesel • Manual</span>
                </div>
              ) : isMahindraBoleroTruck ? (
                <div className="td-subtitle" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span>{truck.year}</span>
                  <span style={{ whiteSpace: 'nowrap' }}>Mahindra BMT PLUS CNG PS BSVI</span>
                  <span>{truck.horsepower} HP • CNG • Manual</span>
                </div>
              ) : isTataAceGold7908 && tataAceGoldDisplay ? (
                <div className="td-subtitle" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span>{tataAceGoldDisplay.yearMonth} (YOM)</span>
                  <span style={{ whiteSpace: 'nowrap' }}>{tataAceGoldDisplay.model}</span>
                  <span>{tataAceGoldDisplay.hp} HP • Diesel • Manual</span>
                </div>
              ) : isTataAceGoldPlain && tataAceGoldPlainDisplay ? (
                <div className="td-subtitle" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span>{tataAceGoldPlainDisplay.yearMonth} (YOM)</span>
                  <span style={{ whiteSpace: 'nowrap' }}>{tataAceGoldPlainDisplay.model}</span>
                  <span>{tataAceGoldPlainDisplay.hp} HP • Diesel • Manual</span>
                </div>
              ) : isTata709gLPT && tata709gLPTDisplay ? (
                <div className="td-subtitle" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span>{tata709gLPTDisplay.yearMonth} (YOM)</span>
                  <span style={{ whiteSpace: 'nowrap' }}>{tata709gLPTDisplay.model}</span>
                  <span>{tata709gLPTDisplay.hp} HP • CNG • Manual</span>
                </div>
              ) : isTata1109gLPT && tata1109gLPTDisplay ? (
                <div className="td-subtitle" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span>{tata1109gLPTDisplay.yearMonth} (YOM)</span>
                  <span style={{ whiteSpace: 'nowrap' }}>{tata1109gLPTDisplay.model}</span>
                  <span>{tata1109gLPTDisplay.hp} HP • CNG • Manual</span>
                </div>
              ) : isTata609G && tata609GDisplay ? (
                <div className="td-subtitle" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span>{tata609GDisplay.yearMonth} (YOM)</span>
                  <span style={{ whiteSpace: 'nowrap' }}>{tata609GDisplay.model}</span>
                  <span>{tata609GDisplay.hp} HP • CNG • Manual</span>
                </div>
              ) : isTata1212LPT && tata1212LPTDisplay ? (
                <div className="td-subtitle" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span>{tata1212LPTDisplay.yearMonth} (YOM)</span>
                  <span style={{ whiteSpace: 'nowrap' }}>{tata1212LPTDisplay.model}</span>
                  <span>{tata1212LPTDisplay.hp} HP • Diesel • Manual</span>
                </div>
              ) : isTata1512GLPT && tata1512GLPTDisplay ? (
                <div className="td-subtitle" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span>{tata1512GLPTDisplay.yearMonth} (YOM)</span>
                  <span style={{ whiteSpace: 'nowrap' }}>{tata1512GLPTDisplay.model}</span>
                  <span>{tata1512GLPTDisplay.hp} HP • CNG • Manual</span>
                </div>
              ) : isEicher2059XPTruck && eicher2059XPDisplay ? (
                <div className="td-subtitle" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span>{eicher2059XPDisplay.yearMonth} (YOM)</span>
                  <span style={{ whiteSpace: 'nowrap' }}>{eicher2059XPDisplay.model}</span>
                  <span>{eicher2059XPDisplay.hp} HP • CNG • Manual</span>
                </div>
              ) : isEicher1075HSDTruck && eicher1075HSDDisplay ? (
                <div className="td-subtitle" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span>{eicher1075HSDDisplay.yearMonth} (YOM)</span>
                  <span style={{ whiteSpace: 'nowrap' }}>{eicher1075HSDDisplay.model}</span>
                  <span>{eicher1075HSDDisplay.hp} HP • Diesel • Manual</span>
                </div>
              ) : isAshokLeylandTruck && ashokLeyland1415Display ? (
                <div className="td-subtitle" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span>{ashokLeyland1415Display.yearMonth} (YOM)</span>
                  <span style={{ whiteSpace: 'nowrap' }}>{ashokLeyland1415Display.model}</span>
                  <span>{ashokLeyland1415Display.hp} HP • CNG • Manual</span>
                </div>
              ) : (
              <p className="td-subtitle">{truck.year} {truck.manufacturer} {truck.model} • {truck.horsepower} HP</p>
              )}
            </div>
            <button className="td-wishlist">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="td-quick-stats">
            <div className="td-stat">
              <span className="td-stat-value">{(
                tataAceGoldDisplay ? tataAceGoldDisplay.kms
                : tataAceGoldPlainDisplay ? tataAceGoldPlainDisplay.kms
                : tata1512GLPTDisplay ? tata1512GLPTDisplay.kms
                : tata1212LPTDisplay ? tata1212LPTDisplay.kms
                : tata609GDisplay ? tata609GDisplay.kms
                : tata709gLPTDisplay ? tata709gLPTDisplay.kms
                : eicherPro2110LDisplay ? eicherPro2110LDisplay.kms
                : bajajMaximaCNGDisplay ? bajajMaximaCNGDisplay.kms
                : ashokLeyland1415Display ? ashokLeyland1415Display.kms
                : eicher2059XPDisplay ? eicher2059XPDisplay.kms
                : eicher1075HSDDisplay ? eicher1075HSDDisplay.kms
                : tata1109gLPTDisplay ? tata1109gLPTDisplay.kms
                : smlIsuzuZT54Display ? smlIsuzuZT54Display.kms
                : truck.kilometers
              )?.toLocaleString('en-IN') || '0'} km</span>
              <span className="td-stat-label">Odometer</span>
            </div>
            <div className="td-stat-divider"></div>
            <div className="td-stat">
              <span className="td-stat-value">{truck.fuel_type || (isTataAceGold7908 || isTataAceGoldPlain || isTata1212LPT || isEicher1075HSDTruck ? 'Diesel' : (isTata1512GLPT || isTata609G || isTata709gLPT || isTata1109gLPT || isAshokLeyland1615Truck || isAshokLeylandTruck || isTata1412Truck || isSmlIsuzuTruck || isEicher2059XPTruck || isMahindraBoleroTruck) ? 'CNG' : 'Diesel')}</span>
              <span className="td-stat-label">Fuel Type</span>
            </div>
            <div className="td-stat-divider"></div>
            <div className="td-stat">
              <span className="td-stat-value">{truck.transmission || 'Manual'}</span>
              <span className="td-stat-label">Transmission</span>
            </div>
            <div className="td-stat-divider"></div>
            <div className="td-stat">
              <span className="td-stat-value">{ownershipShort(truck.ownership_number) || '1st'}</span>
              <span className="td-stat-label">Owner</span>
            </div>
          </div>

          {/* Price Card */}
          <div className="td-price-card">
            <div className="td-price-top">
              <div className="td-price-main">
                <span className="td-price-current">{displayPrice(
                  tataAceGoldDisplay ? tataAceGoldDisplay.price
                  : tataAceGoldPlainDisplay ? tataAceGoldPlainDisplay.price
                  : tata1512GLPTDisplay ? tata1512GLPTDisplay.price
                  : tata1212LPTDisplay ? tata1212LPTDisplay.price
                  : tata609GDisplay ? tata609GDisplay.price
                  : tata709gLPTDisplay ? tata709gLPTDisplay.price
                  : tata1109gLPTDisplay ? tata1109gLPTDisplay.price
                  : eicherPro2110LDisplay ? eicherPro2110LDisplay.price
                  : bajajMaximaCNGDisplay ? bajajMaximaCNGDisplay.price
                  : eicher2059XPDisplay ? eicher2059XPDisplay.price
                  : eicher1075HSDDisplay ? eicher1075HSDDisplay.price
                  : mahindraBoleroDisplay ? mahindraBoleroDisplay.price
                  : smlIsuzuZT54Display ? smlIsuzuZT54Display.price
                  : truck.price
                )}</span>
                <span className="td-price-original">{displayPrice(
                  tataAceGoldDisplay ? Math.round(tataAceGoldDisplay.price * 1.08)
                  : tataAceGoldPlainDisplay ? Math.round(tataAceGoldPlainDisplay.price * 1.08)
                  : tata1512GLPTDisplay ? Math.round(tata1512GLPTDisplay.price * 1.08)
                  : tata1212LPTDisplay ? Math.round(tata1212LPTDisplay.price * 1.08)
                  : tata609GDisplay ? Math.round(tata609GDisplay.price * 1.08)
                  : tata709gLPTDisplay ? Math.round(tata709gLPTDisplay.price * 1.08)
                  : tata1109gLPTDisplay ? Math.round(tata1109gLPTDisplay.price * 1.08)
                  : eicherPro2110LDisplay ? Math.round(eicherPro2110LDisplay.price * 1.08)
                  : bajajMaximaCNGDisplay ? Math.round(bajajMaximaCNGDisplay.price * 1.08)
                  : eicher2059XPDisplay ? Math.round(eicher2059XPDisplay.price * 1.08)
                  : eicher1075HSDDisplay ? Math.round(eicher1075HSDDisplay.price * 1.08)
                  : mahindraBoleroDisplay ? Math.round(mahindraBoleroDisplay.price * 1.08)
                  : smlIsuzuZT54Display ? Math.round(smlIsuzuZT54Display.price * 1.08)
                  : listPrice
                )}</span>
              </div>
              <span className="td-savings-badge">Save ₹{(tataAceGoldDisplay ? Math.round(tataAceGoldDisplay.price * 0.08) : tataAceGoldPlainDisplay ? Math.round(tataAceGoldPlainDisplay.price * 0.08) : tata1512GLPTDisplay ? Math.round(tata1512GLPTDisplay.price * 0.08) : tata1212LPTDisplay ? Math.round(tata1212LPTDisplay.price * 0.08) : tata609GDisplay ? Math.round(tata609GDisplay.price * 0.08) : tata709gLPTDisplay ? Math.round(tata709gLPTDisplay.price * 0.08) : tata1109gLPTDisplay ? Math.round(tata1109gLPTDisplay.price * 0.08) : eicherPro2110LDisplay ? Math.round(eicherPro2110LDisplay.price * 0.08) : bajajMaximaCNGDisplay ? Math.round(bajajMaximaCNGDisplay.price * 0.08) : eicher2059XPDisplay ? Math.round(eicher2059XPDisplay.price * 0.08) : eicher1075HSDDisplay ? Math.round(eicher1075HSDDisplay.price * 0.08) : mahindraBoleroDisplay ? Math.round(mahindraBoleroDisplay.price * 0.08) : smlIsuzuZT54Display ? Math.round(smlIsuzuZT54Display.price * 0.08) : savings).toLocaleString()}</span>
            </div>
            <div className="td-emi-bar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              <span>EMI from <strong>₹{Math.round(monthlyEMI).toLocaleString()}/mo</strong></span>
              <span className="td-rate">@ {rateOfInterest}%</span>
              <button 
                className="td-emi-calculator-btn"
                onClick={() => {
                  setActiveSection('finance')
                  setTimeout(() => {
                    const financeSection = document.querySelector('.td-tabs-section')
                    if (financeSection) {
                      financeSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }, 100)
                }}
              >
                Calculate EMI
              </button>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="td-cta-group">
            <button className="td-btn-primary" onClick={() => setShowContactForm(true)}>
              Get Best Price
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
            <button className="td-btn-secondary" onClick={() => setShowTestDriveForm(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Book a Test Drive
            </button>
          </div>

          {/* Trust Badges */}
          <div className="td-trust-row">
            <div className="td-trust-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              <span>RC transfer included</span>
            </div>
          </div>

          {/* Location section removed as per request */}

          {/* Share buttons removed as per request */}
        </div>
      </div>

      {/* Tabs Section */}
      <div className="td-tabs-section">
        <div className="td-tabs-nav">
          {[
            { id: 'specs', label: 'Specifications' },
            { id: 'inspection', label: 'Quality Report' },
            { id: 'finance', label: 'EMI Calculator' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`td-tab ${activeSection === tab.id ? 'active' : ''}`}
              onClick={() => setActiveSection(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="td-tabs-content">
          {/* Specifications */}
          {activeSection === 'specs' && (
            <div className="td-panel">
              <h2 className="td-panel-title">Vehicle Specifications</h2>
              <div className="td-specs-grid">
                {(() => {
                  // Extract emission standard from subtitle
                  // TODO: no emission-standard column exists; falls back to a default
                  let emissionStandard = truck.fuel_type || 'Diesel (BS-VI)'
                  if (truck.subtitle) {
                    const subtitleParts = truck.subtitle.split('•')
                    if (subtitleParts.length > 0) {
                      const emissionPart = subtitleParts[0].trim()
                      if (emissionPart.includes('CNG')) {
                        emissionStandard = 'CNG'
                      } else if (emissionPart.includes('BS4') || emissionPart.includes('BS 4')) {
                        emissionStandard = 'Diesel (BS4)'
                      } else if (emissionPart.includes('BS6') || emissionPart.includes('BS 6')) {
                        emissionStandard = 'Diesel (BS6)'
                      } else if (emissionPart.includes('Euro4') || emissionPart.includes('Euro 4')) {
                        emissionStandard = 'Diesel (Euro4)'
                      } else if (emissionPart.includes('Euro3') || emissionPart.includes('Euro 3') || emissionPart.includes('BS Euro3')) {
                        emissionStandard = 'Diesel (BS Euro3)'
                      }
                    }
                  }
                  
                  // Special handling for ASHOK LEYLAND ECOMET STAR, Tata Ace Gold (7908), TATA 1512G LPT, Eicher Pro 2059 XP, Eicher Pro 1075 F HSD
                  const isEicher2059XP = (truck.name || '').toLowerCase().includes('2059') && ((truck.name || '').toLowerCase().includes('eicher') || (truck.manufacturer === 'Eicher Motors' && truck.model?.toLowerCase().includes('2059')))
                  const isEicher1075HSD = (truck.name || '').toLowerCase().includes('1075') && ((truck.name || '').toLowerCase().includes('eicher') || (truck.manufacturer === 'Eicher Motors' && (truck.model || '').toLowerCase().includes('1075')))
                  const rtoValue = isAshokLeylandTruck ? 'GHAZIABAD' : isAshokLeyland1615Truck ? 'GHAZIABAD' : isTata1412Truck ? 'SONIPAT' : isSmlIsuzuTruck ? 'RAJPUR ROAD' : isSmlIsuzuZT54 && smlIsuzuZT54Display ? smlIsuzuZT54Display.rto : isMahindraBoleroTruck ? 'RAJPUR ROAD' : isTataAceGold7908 || isTataAceGoldPlain ? 'Ghaziabad' : isTata1512GLPT ? 'Rajpur Road' : isTata1212LPT ? (tata1212LPTDisplay?.rto ?? 'Faridabad') : isTata609G ? (tata609GDisplay?.rto ?? 'Rajpur Road') : isTata709gLPT ? (tata709gLPTDisplay?.rto ?? 'Rajpur Road') : isTata1109gLPT && tata1109gLPTDisplay ? tata1109gLPTDisplay.rto : isEicher2059XP ? (eicher2059XPDisplay?.rto ?? 'Dwarka, Delhi') : isEicher1075HSD && eicher1075HSDDisplay ? eicher1075HSDDisplay.rto : isEicherPro2110L ? (eicherPro2110LDisplay?.rto ?? 'Bahadurgarh, Haryana') : isBajajMaximaCNG ? (bajajMaximaCNGDisplay?.rto ?? 'RAJPUR ROAD') : (truck as any).rto || truck.location || truck.city || 'MH-14 (Pune)'
                  const insuranceValue = isAshokLeylandTruck ? '01/01/27' : isAshokLeyland1615Truck ? '11/01/27' : isTata1412Truck ? '05/05/26' : isSmlIsuzuTruck ? '24/04/26' : isSmlIsuzuZT54 && smlIsuzuZT54Display ? smlIsuzuZT54Display.insurance : isMahindraBoleroTruck ? '01/09/26' : isTataAceGold7908 ? '14.12.2023' : isTataAceGoldPlain ? '17.03.2026' : isTata1512GLPT ? '24.09.2026' : isTata1212LPT ? (tata1212LPTDisplay?.insurance ?? '30.12.2025') : isTata609G ? (tata609GDisplay?.insurance ?? '02.08.2026') : isTata709gLPT ? (tata709gLPTDisplay?.insurance ?? '20.02.2027') : isTata1109gLPT && tata1109gLPTDisplay ? tata1109gLPTDisplay.insurance : isEicher2059XP && eicher2059XPDisplay ? eicher2059XPDisplay.insurance : isEicher1075HSD && eicher1075HSDDisplay ? eicher1075HSDDisplay.insurance : isEicherPro2110L ? (eicherPro2110LDisplay?.insurance ?? '12.02.2026') : isBajajMaximaCNG ? (bajajMaximaCNGDisplay?.insurance ?? '09/06/2026') : formatDbDate((truck as any).insurance_date) || 'Valid till Dec 2025'
                  const modelValue = isAshokLeyland1615Truck ? 'ASHOK LEYLAND ECOMET STAR 1615 HE' : isTataAceGold7908 ? (tataAceGoldDisplay?.model ?? 'TATA ACE GOLD BS-IV') : isTataAceGoldPlain ? (tataAceGoldPlainDisplay?.model ?? 'TATA ACE GOLD BS-IV') : isTata1512GLPT ? (tata1512GLPTDisplay?.model ?? '1512G LPT DCR48CBC 125B6M5') : isTata1212LPT ? (tata1212LPTDisplay?.model ?? '1212 LPT DCR48CBC 125B6M5') : isTata609G ? (tata609GDisplay?.model ?? 'SFC DCR33CBC 85B6M5') : isTata709gLPT ? (tata709gLPTDisplay?.model ?? '709G LPT DCR38CBC 85B6M5 TT') : isTata1109gLPT && tata1109gLPTDisplay ? tata1109gLPTDisplay.model : isEicher2059XP && eicher2059XPDisplay ? eicher2059XPDisplay.model : isEicher1075HSD && eicher1075HSDDisplay ? eicher1075HSDDisplay.model : isSmlIsuzuZT54 && smlIsuzuZT54Display ? smlIsuzuZT54Display.model : isEicherPro2110L ? (eicherPro2110LDisplay?.model ?? 'PRO 2110L') : isBajajMaximaCNG ? (bajajMaximaCNGDisplay?.model ?? 'BAJAJ MAXIMA CARGO CNG') : truck.model
                  
                  // Check for CNG fuel type for Tata 1412, SML Isuzu, TATA 1512G LPT, TATA 609G
                  if ((isTata1412Truck || isSmlIsuzuTruck || isTata1512GLPT || isTata609G || isTata709gLPT || isTata1109gLPT) && !emissionStandard.includes('CNG')) {
                    emissionStandard = 'CNG'
                  }
                  // Tata Ace Gold (both variants) – diesel BS-IV
                  if (isTataAceGold7908 || isTataAceGoldPlain) {
                    emissionStandard = 'Diesel (BS-IV)'
                  }
                  if (isEicherPro2110L || isTata1212LPT) {
                    emissionStandard = 'Diesel'
                  }
                  if (isBajajMaximaCNG) {
                    emissionStandard = 'CNG'
                  }
                  if (isEicher2059XP && eicher2059XPDisplay) {
                    emissionStandard = 'CNG'
                  }
                  if (isEicher1075HSD && eicher1075HSDDisplay) {
                    emissionStandard = 'Diesel'
                  }
                  if (isMahindraBoleroTruck) {
                    emissionStandard = 'CNG'
                  }
                  if (isSmlIsuzuTruck) {
                    emissionStandard = 'CNG'
                  }
                  if (isSmlIsuzuZT54 && smlIsuzuZT54Display) {
                    emissionStandard = 'Diesel'
                  }
                  // Use fuel_type from API/database for trucks without special-case overrides (e.g. Tata 609g)
                  const hasSpecialFuel = isTata1412Truck || isSmlIsuzuTruck || isTata1512GLPT || isTata609G || isTata709gLPT || isTata1109gLPT || isTataAceGold7908 || isTataAceGoldPlain || isEicherPro2110L || isTata1212LPT || isBajajMaximaCNG || isEicher2059XP || isEicher1075HSD || isMahindraBoleroTruck || isSmlIsuzuZT54
                  if (!hasSpecialFuel && (truck as any).fuel_type && typeof (truck as any).fuel_type === 'string') {
                    emissionStandard = (truck as any).fuel_type
                  }
                  if (!hasSpecialFuel && truck.emission_norm && !emissionStandard.includes('(')) {
                    emissionStandard = `${emissionStandard} (${truck.emission_norm})`
                  }
                  
                  const gearboxValue = isSmlIsuzuZT54 && smlIsuzuZT54Display
                    ? smlIsuzuZT54Display.gearbox
                    : isAshokLeylandTruck && ashokLeyland1415Display
                    ? ashokLeyland1415Display.gearbox
                    : isEicher2059XP && eicher2059XPDisplay
                      ? eicher2059XPDisplay.gearbox
                      : isEicher1075HSDTruck && eicher1075HSDDisplay
                        ? eicher1075HSDDisplay.gearbox
                        : isEicherPro2110L
                      ? (eicherPro2110LDisplay?.gearbox ?? '5 forward, 1 reverse')
                      : isBajajMaximaCNG
                        ? (bajajMaximaCNGDisplay?.gearbox ?? '4 forward, 1 reverse')
                        : (isTataAceGold7908 || isTataAceGoldPlain || isTata1512GLPT || isTata1212LPT || isTata609G || isTata709gLPT || isTata1109gLPT)
                          ? (isTata1109gLPT && tata1109gLPTDisplay ? tata1109gLPTDisplay.gearbox : '5-Forward, 1-Reverse')
                          : (truck as any).gearbox || '6-Speed Manual'
                  const yearValue = isSmlIsuzuZT54 && smlIsuzuZT54Display
                    ? smlIsuzuZT54Display.yearMonth
                    : isAshokLeylandTruck && ashokLeyland1415Display
                    ? ashokLeyland1415Display.yearMonth
                    : isEicher2059XP && eicher2059XPDisplay
                    ? eicher2059XPDisplay.yearMonth
                    : isEicher1075HSDTruck && eicher1075HSDDisplay
                    ? eicher1075HSDDisplay.yearMonth
                    : isTataAceGold7908 && tataAceGoldDisplay ? tataAceGoldDisplay.yearMonth
                    : isTataAceGoldPlain && tataAceGoldPlainDisplay ? tataAceGoldPlainDisplay.yearMonth
                    : isTata1512GLPT && tata1512GLPTDisplay ? tata1512GLPTDisplay.yearMonth
                    : isTata1212LPT && tata1212LPTDisplay ? tata1212LPTDisplay.yearMonth
                    : isTata609G && tata609GDisplay ? tata609GDisplay.yearMonth
                    : isTata709gLPT && tata709gLPTDisplay ? tata709gLPTDisplay.yearMonth
                    : isTata1109gLPT && tata1109gLPTDisplay ? tata1109gLPTDisplay.yearMonth
                    : isEicherPro2110L && eicherPro2110LDisplay ? eicherPro2110LDisplay.yearMonth
                    : isBajajMaximaCNG && bajajMaximaCNGDisplay ? bajajMaximaCNGDisplay.yearMonth
                    : truck.manufactured_on || truck.year
                  const odometerValue = isSmlIsuzuZT54 && smlIsuzuZT54Display
                    ? `${smlIsuzuZT54Display.kms.toLocaleString('en-IN')} km`
                    : isAshokLeylandTruck && ashokLeyland1415Display
                    ? `${ashokLeyland1415Display.kms.toLocaleString('en-IN')} km`
                    : isEicher2059XP && eicher2059XPDisplay
                    ? `${eicher2059XPDisplay.kms.toLocaleString('en-IN')} km`
                    : isEicher1075HSDTruck && eicher1075HSDDisplay
                    ? `${eicher1075HSDDisplay.kms.toLocaleString('en-IN')} km`
                    : isTataAceGold7908 && tataAceGoldDisplay ? `${tataAceGoldDisplay.kms.toLocaleString('en-IN')} km`
                    : isTataAceGoldPlain && tataAceGoldPlainDisplay ? `${tataAceGoldPlainDisplay.kms.toLocaleString('en-IN')} km`
                    : isTata1512GLPT && tata1512GLPTDisplay ? `${tata1512GLPTDisplay.kms.toLocaleString('en-IN')} km`
                    : isTata1212LPT && tata1212LPTDisplay ? `${tata1212LPTDisplay.kms.toLocaleString('en-IN')} km`
                    : isTata609G && tata609GDisplay ? `${tata609GDisplay.kms.toLocaleString('en-IN')} km`
                    : isTata709gLPT && tata709gLPTDisplay ? `${tata709gLPTDisplay.kms.toLocaleString('en-IN')} km`
                    : isTata1109gLPT && tata1109gLPTDisplay ? `${tata1109gLPTDisplay.kms.toLocaleString('en-IN')} km`
                    : isEicherPro2110L && eicherPro2110LDisplay ? `${eicherPro2110LDisplay.kms.toLocaleString('en-IN')} km`
                    : isBajajMaximaCNG && bajajMaximaCNGDisplay ? `${bajajMaximaCNGDisplay.kms.toLocaleString('en-IN')} km`
                    : `${truck.kilometers?.toLocaleString('en-IN') || '0'} km`
                  const powerValue = isSmlIsuzuZT54 && smlIsuzuZT54Display
                    ? smlIsuzuZT54Display.powerDisplay
                    : isAshokLeylandTruck && ashokLeyland1415Display
                    ? `${ashokLeyland1415Display.hp} HP`
                    : isEicher2059XP && eicher2059XPDisplay
                    ? `${eicher2059XPDisplay.hp} HP`
                    : isEicher1075HSDTruck && eicher1075HSDDisplay
                    ? `${eicher1075HSDDisplay.hp} HP`
                    : isTataAceGold7908 && tataAceGoldDisplay ? `${tataAceGoldDisplay.hp} HP`
                    : isTataAceGoldPlain && tataAceGoldPlainDisplay ? `${tataAceGoldPlainDisplay.hp} HP`
                    : isTata1512GLPT && tata1512GLPTDisplay ? `${tata1512GLPTDisplay.hp} HP`
                    : isTata1212LPT && tata1212LPTDisplay ? `${tata1212LPTDisplay.hp} HP`
                    : isTata609G && tata609GDisplay ? `${tata609GDisplay.hp} HP`
                    : isTata709gLPT && tata709gLPTDisplay ? `${tata709gLPTDisplay.hp} HP`
                    : isTata1109gLPT && tata1109gLPTDisplay ? `${tata1109gLPTDisplay.hp} HP`
                    : isEicherPro2110L && eicherPro2110LDisplay ? `${eicherPro2110LDisplay.hp} HP`
                    : isBajajMaximaCNG && bajajMaximaCNGDisplay ? `${bajajMaximaCNGDisplay.hp} HP`
                    : `${truck.horsepower} HP`
                  const ownershipValue = isSmlIsuzuZT54 && smlIsuzuZT54Display
                    ? smlIsuzuZT54Display.ownership
                    : isAshokLeylandTruck && ashokLeyland1415Display
                    ? ashokLeyland1415Display.ownership
                    : isEicher2059XP && eicher2059XPDisplay
                    ? eicher2059XPDisplay.ownership
                    : isEicher1075HSDTruck && eicher1075HSDDisplay
                    ? eicher1075HSDDisplay.ownership
                    : isTataAceGold7908 && tataAceGoldDisplay ? tataAceGoldDisplay.ownership
                    : isTataAceGoldPlain && tataAceGoldPlainDisplay ? tataAceGoldPlainDisplay.ownership
                    : isTata1512GLPT && tata1512GLPTDisplay ? tata1512GLPTDisplay.ownership
                    : isTata1212LPT && tata1212LPTDisplay ? tata1212LPTDisplay.ownership
                    : isTata609G && tata609GDisplay ? tata609GDisplay.ownership
                    : isTata709gLPT && tata709gLPTDisplay ? tata709gLPTDisplay.ownership
                    : isTata1109gLPT && tata1109gLPTDisplay ? tata1109gLPTDisplay.ownership
                    : isEicherPro2110L && eicherPro2110LDisplay ? eicherPro2110LDisplay.ownership
                    : isBajajMaximaCNG && bajajMaximaCNGDisplay ? bajajMaximaCNGDisplay.ownership
                    : ((truck as any).ownership_number != null && (truck as any).ownership_number !== undefined)
                      ? `${ownershipShort((truck as any).ownership_number)} Owner`
                      : 'First Owner'
                  const specRows = [
                    { label: 'Year', value: yearValue },
                    { label: 'Brand', value: truck.manufacturer },
                    { label: 'Model', value: modelValue },
                    { label: 'Fuel', value: emissionStandard },
                    { label: 'Odometer', value: odometerValue },
                    { label: 'Power', value: powerValue },
                    ...(truck.engine_capacity && !(isSmlIsuzuZT54 && smlIsuzuZT54Display) ? [{ label: 'Engine', value: `${Number(truck.engine_capacity).toLocaleString('en-IN')} cc` }] : []),
                    ...(truck.mileage_kmpl ? [{ label: 'Mileage', value: `${truck.mileage_kmpl} ${truck.fuel_type === 'CNG' ? 'km/kg' : 'km/l'}` }] : []),
                    { label: 'Gearbox', value: gearboxValue },
                    { label: 'RTO', value: rtoValue },
                    { label: 'Insurance', value: insuranceValue },
                    { label: 'Ownership', value: ownershipValue },
                    ...(isTataAceGold7908 && tataAceGoldDisplay ? [{ label: 'Tyres', value: String(tataAceGoldDisplay.tyres) }] : []),
                    ...(isTataAceGoldPlain && tataAceGoldPlainDisplay ? [{ label: 'Tyres', value: String(tataAceGoldPlainDisplay.tyres) }] : []),
                    ...(isTata1512GLPT && tata1512GLPTDisplay ? [{ label: 'Tyres', value: String(tata1512GLPTDisplay.tyres) }] : []),
                    ...(isTata1212LPT && tata1212LPTDisplay ? [{ label: 'Tyres', value: String(tata1212LPTDisplay.tyres) }] : []),
                    ...(isTata609G && tata609GDisplay ? [{ label: 'Tyres', value: String(tata609GDisplay.tyres) }] : []),
                    ...(isTata709gLPT && tata709gLPTDisplay ? [{ label: 'Tyres', value: String(tata709gLPTDisplay.tyres) }] : []),
                    ...(isTata1109gLPT && tata1109gLPTDisplay ? [{ label: 'Tyres', value: String(tata1109gLPTDisplay.tyres) }] : []),
                    ...(isEicherPro2110L && eicherPro2110LDisplay ? [{ label: 'Tyres', value: String(eicherPro2110LDisplay.tyres) }] : []),
                    ...(isBajajMaximaCNG && bajajMaximaCNGDisplay ? [{ label: 'Tyres', value: String(bajajMaximaCNGDisplay.tyres) }] : []),
                    ...(isAshokLeylandTruck && ashokLeyland1415Display ? [{ label: 'Tyres', value: String(ashokLeyland1415Display.tyres) }] : []),
                    ...(isEicher2059XPTruck && eicher2059XPDisplay ? [{ label: 'Tyres', value: String(eicher2059XPDisplay.tyres) }] : []),
                    ...(isEicher1075HSDTruck && eicher1075HSDDisplay ? [{ label: 'Tyres', value: String(eicher1075HSDDisplay.tyres) }] : []),
                    ...(isSmlIsuzuZT54 && smlIsuzuZT54Display ? [{ label: 'Tyres', value: String(smlIsuzuZT54Display.tyres) }] : []),
                    ...(((truck as any).tyres != null && (truck as any).tyres !== undefined) && !isTataAceGold7908 && !isTataAceGoldPlain && !isTata1512GLPT && !isTata1212LPT && !isTata609G && !isTata709gLPT && !isTata1109gLPT && !isEicherPro2110L && !isBajajMaximaCNG && !isAshokLeylandTruck && !isEicher2059XPTruck && !isEicher1075HSDTruck && !isSmlIsuzuZT54 ? [{ label: 'Tyres', value: String((truck as any).tyres) }] : []),
                  ]
                  return specRows.map((spec, idx) => (
                    <div key={idx} className="td-spec-row">
                      <span className="td-spec-label">{spec.label}</span>
                      <span className="td-spec-value">{spec.value}</span>
                    </div>
                  ))
                })()}
              </div>

              <h3 className="td-subsection-title">Load Capacity</h3>
              <div className="td-load-cards">
                <div className="td-load-card">
                  <span className="td-load-value">
                    {isBajajMaximaCNG && bajajMaximaCNGDisplay && bajajMaximaCNGDisplay.grossPayloadKg == null
                      ? '–'
                      : isTata709gLPT && tata709gLPTDisplay
                        ? (tata709gLPTDisplay.grossPayloadKg / 1000).toFixed(2)
                        : isTata1109gLPT && tata1109gLPTDisplay
                          ? (tata1109gLPTDisplay.grossPayloadKg / 1000).toFixed(2)
                          : isTata1212LPT && tata1212LPTDisplay
                          ? (tata1212LPTDisplay.grossPayloadKg / 1000).toFixed(2)
                          : isEicherPro2110L && eicherPro2110LDisplay
                            ? (eicherPro2110LDisplay.grossPayloadKg / 1000).toFixed(2)
                            : isEicher2059XPTruck && eicher2059XPDisplay
                              ? (eicher2059XPDisplay.grossPayloadKg / 1000).toFixed(2)
                              : isEicher1075HSDTruck && eicher1075HSDDisplay
                                ? (eicher1075HSDDisplay.grossPayloadKg / 1000).toFixed(2)
                                : isSmlIsuzuZT54 && smlIsuzuZT54Display
                                  ? (smlIsuzuZT54Display.grossPayloadKg / 1000).toFixed(2)
                                  : isAshokLeylandTruck
                                ? '14.25'
                                : isAshokLeyland1615Truck
                                  ? '12'
                                  : isTata1412Truck
                                    ? '14.25'
                                    : isSmlIsuzuTruck
                                      ? '16.37'
                                      : isMahindraBoleroTruck
                                        ? '2.75'
                                        : isTataAceGold7908 || isTataAceGoldPlain
                                          ? '1.55'
                                          : isTata1512GLPT
                                            ? '16.02'
                                            : isTata609G && tata609GDisplay
                                              ? (tata609GDisplay.grossPayloadKg / 1000).toFixed(2)
                                              : (dbGrossLoad?.text ?? '16.2')}{(isBajajMaximaCNG && bajajMaximaCNGDisplay?.grossPayloadKg == null) || (!hasLegacyLoadFigures && dbGrossLoad && !dbGrossLoad.tonnes) ? '' : <small>T</small>}
                  </span>
                  <span className="td-load-label">{isTataAceGold7908 || isTataAceGoldPlain || isTata1512GLPT || isTata1212LPT || isTata609G || isTata709gLPT || isTata1109gLPT || isEicherPro2110L || isBajajMaximaCNG || isEicher2059XPTruck || isEicher1075HSDTruck || isSmlIsuzuZT54 ? 'Gross Payload' : 'Gross Weight'}</span>
                </div>
                <div className="td-load-card highlight">
                  <span className="td-load-value">
                    {isBajajMaximaCNG && bajajMaximaCNGDisplay && bajajMaximaCNGDisplay.netPayloadKg == null
                      ? '–'
                      : isTata709gLPT && tata709gLPTDisplay
                        ? (tata709gLPTDisplay.netPayloadKg / 1000).toFixed(3)
                          : isTata1109gLPT && tata1109gLPTDisplay
                            ? (tata1109gLPTDisplay.netPayloadKg / 1000).toFixed(3)
                          : isTata1212LPT && tata1212LPTDisplay
                            ? (tata1212LPTDisplay.netPayloadKg / 1000).toFixed(3)
                          : isEicherPro2110L && eicherPro2110LDisplay
                            ? (eicherPro2110LDisplay.netPayloadKg / 1000).toFixed(3)
                            : isEicher2059XPTruck && eicher2059XPDisplay
                              ? (eicher2059XPDisplay.netPayloadKg / 1000).toFixed(3)
                              : isEicher1075HSDTruck && eicher1075HSDDisplay
                                ? (eicher1075HSDDisplay.netPayloadKg / 1000).toFixed(3)
                                : isSmlIsuzuZT54 && smlIsuzuZT54Display
                                  ? (smlIsuzuZT54Display.netPayloadKg / 1000).toFixed(3)
                                  : isAshokLeylandTruck && ashokLeyland1415Display
                                  ? (ashokLeyland1415Display.netPayloadKg / 1000).toFixed(3)
                                  : isAshokLeyland1615Truck
                                  ? '6'
                                  : isTata1412Truck
                                    ? '8.5'
                                    : isSmlIsuzuTruck
                                      ? '12'
                                      : isMahindraBoleroTruck
                                        ? '1.6'
                                        : isTataAceGold7908 || isTataAceGoldPlain
                                          ? '0.71'
                                          : isTata1512GLPT
                                            ? '8.62'
                                            : isTata609G && tata609GDisplay
                                              ? (tata609GDisplay.netPayloadKg / 1000).toFixed(3)
                                              : (dbNetLoad?.text ?? '10')}{(isBajajMaximaCNG && bajajMaximaCNGDisplay?.netPayloadKg == null) || (!hasLegacyLoadFigures && dbNetLoad && !dbNetLoad.tonnes) ? '' : <small>T</small>}
                  </span>
                  <span className="td-load-label">{isTataAceGold7908 || isTataAceGoldPlain || isTata1512GLPT || isTata1212LPT || isTata609G || isTata709gLPT || isTata1109gLPT || isEicherPro2110L || isBajajMaximaCNG || isEicher2059XPTruck || isEicher1075HSDTruck || isSmlIsuzuZT54 ? 'Net Payload' : 'Payload'}</span>
                </div>
                <div className="td-load-card">
                  <span className="td-load-value">
                    {isBajajMaximaCNG && bajajMaximaCNGDisplay ? String(bajajMaximaCNGDisplay.bodyFt)
                      : isEicherPro2110L && eicherPro2110LDisplay ? String(eicherPro2110LDisplay.bodyFt)
                      : isEicher2059XPTruck && eicher2059XPDisplay ? String(eicher2059XPDisplay.bodyFt)
                      : isEicher1075HSDTruck && eicher1075HSDDisplay ? String(eicher1075HSDDisplay.bodyFt)
                      : isSmlIsuzuZT54 && smlIsuzuZT54Display ? String(smlIsuzuZT54Display.bodyFt)
                      : isTata1212LPT && tata1212LPTDisplay ? String(tata1212LPTDisplay.bodyFt)
                      : isTata709gLPT && tata709gLPTDisplay ? String(tata709gLPTDisplay.bodyFt)
                      : isTata1109gLPT && tata1109gLPTDisplay ? String(tata1109gLPTDisplay.bodyFt)
                      : isTata609G && tata609GDisplay ? String(tata609GDisplay.bodyFt)
                      : isAshokLeylandTruck ? '24'
                      : isAshokLeyland1615Truck || isTata1412Truck || isSmlIsuzuTruck || isTata1512GLPT ? '22'
                      : isMahindraBoleroTruck ? '08'
                      : isTataAceGold7908 || isTataAceGoldPlain ? '7.2'
                      : (dbBodyLength?.text ?? '20')}<small>ft</small>
                  </span>
                  <span className="td-load-label">Body Length</span>
                </div>
              </div>
            </div>
          )}

          {/* Quality Report / Inspection */}
          {activeSection === 'inspection' && (
            <div className="td-panel td-report-panel">
              {/* Report Header */}
              <div className="td-report-header">
                <div className="td-report-header-left">
                  <h2 className="td-panel-title">Truck Quality Report</h2>
                  <p className="td-report-subtitle">200+ checkpoints evaluated by certified mechanics</p>
                </div>
                <div className="td-report-score-main">
                  <div className="td-score-circle" style={{ '--score-color': getScoreColor(parseFloat(overallScore)) } as React.CSSProperties}>
                    <span className="td-score-num">{overallScore}</span>
                    <span className="td-score-label">Overall</span>
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <div className="td-highlights">
                <h4 className="td-highlights-label">HIGHLIGHTS</h4>
                <div className="td-highlights-grid">
                  {highlightsFor(truck).map((h, idx) => (
                    <div key={idx} className="td-highlight-item">
                      <div className="td-highlight-icon">
                        {h.icon === 'power' && (
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                          </svg>
                        )}
                        {h.icon === 'ac' && (
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 2v10M12 12l8 4M12 12L4 16M12 12v10"/>
                            <path d="M17 7l-5 5-5-5"/>
                          </svg>
                        )}
                        {h.icon === 'fuel' && (
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/>
                            <path d="M3 10h12M7 22v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/>
                            <path d="M15 6h2a2 2 0 0 1 2 2v4l2 2v6h-2"/>
                          </svg>
                        )}
                      </div>
                      <div className="td-highlight-text">
                        <span className="td-highlight-name">{h.label}</span>
                        <span className="td-highlight-desc">{h.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Score Tabs */}
              <div className="td-score-tabs">
                {Object.entries(inspectionData).map(([key, data]) => (
                  <button
                    key={key}
                    className={`td-score-tab ${activeReportTab === key ? 'active' : ''}`}
                    onClick={() => setActiveReportTab(key)}
                  >
                    <span className="td-score-tab-label">{data.label}</span>
                    <span 
                      className="td-score-tab-badge" 
                      style={{ background: getScoreColor(data.score) }}
                    >
                      {data.score}
                    </span>
                  </button>
                ))}
              </div>

              {/* How Scores Work */}
              <button className="td-scores-info">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <span>See how scores are calculated</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>

              {/* Category Details */}
              <div className="td-category-details">
                {Object.entries(inspectionData).map(([key, data]) => (
                  <div 
                    key={key} 
                    className={`td-category-card ${expandedItems.includes(key) ? 'expanded' : ''} ${activeReportTab === key ? 'active' : ''}`}
                  >
                    <button 
                      className="td-category-header"
                      onClick={() => toggleExpandItem(key)}
                    >
                      <div className="td-category-left">
                        <div className="td-category-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <path d="M3 9h18M9 21V9"/>
                          </svg>
                        </div>
                        <div className="td-category-info">
                          <span className="td-category-name">{data.label}</span>
                          <span className="td-category-parts">{data.parts} parts across {data.assemblies} assemblies</span>
                        </div>
                      </div>
                      <div className="td-category-right">
                        <div className="td-category-score" style={{ background: getScoreColor(data.score) }}>
                          <span>{data.score}</span>
                          <small>{data.status}</small>
                        </div>
                        <svg className="td-expand-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 9l6 6 6-6"/>
                        </svg>
                      </div>
                    </button>
                    
                    {expandedItems.includes(key) && (
                      <div className="td-category-items">
                        {data.items.map((item, idx) => (
                          <div key={idx} className="td-category-item">
                            <div className="td-item-left">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
                                <path d="M20 6L9 17l-5-5"/>
                              </svg>
                              <div>
                                <span className="td-item-name">{item.name}{'score' in item && item.score ? `: ${item.score}` : ''}</span>
                                <span className="td-item-status">{item.status}</span>
                              </div>
                            </div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                              <path d="M9 18l6-6-6-6"/>
                            </svg>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* PDF Reports Section - the truck's report links from the DB */}
              {(truck.inspection_report_url || truck.legal_report_url) && (
                <div className="td-pdf-reports-section" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>Quality Reports & Documents</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                      {
                        url: truck.inspection_report_url,
                        title: 'Vehicle Inspection Report',
                        fileName: `Vehicle Inspection Report${truck.registration_number ? ` ${truck.registration_number}` : ''}.pdf`,
                        description: `Comprehensive vehicle inspection report${truck.registration_number ? ` ${truck.registration_number}` : ''} with detailed analysis`,
                        color: '#dc2626',
                      },
                      {
                        url: truck.legal_report_url,
                        title: 'Legal Report',
                        fileName: `Legal Report${truck.registration_number ? ` ${truck.registration_number}` : ''}.pdf`,
                        description: 'Legal documentation including RC, permits, insurance, and challans',
                        color: '#2563eb',
                      },
                    ].filter((report) => report.url).map((report) => (
                      <a
                        key={report.title}
                        href={reportDownloadUrl(report.url as string, report.fileName)}
                        download
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          padding: '1rem',
                          backgroundColor: '#f9fafb',
                          borderRadius: '0.5rem',
                          border: '1px solid #e5e7eb',
                          textDecoration: 'none',
                          color: '#111827',
                          transition: 'all 0.2s',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3f4f6'
                          e.currentTarget.style.borderColor = '#d1d5db'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb'
                          e.currentTarget.style.borderColor = '#e5e7eb'
                        }}
                      >
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '0.5rem',
                          backgroundColor: report.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                          </svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{report.title}</div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{report.description}</div>
                        </div>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* View Full Report Button */}
              <button className="td-view-report-btn" onClick={handleViewFullReportClick}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                View Full Quality Report
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          )}

          {/* Finance Calculator */}
          {activeSection === 'finance' && (
            <div className="td-panel">
              <h2 className="td-panel-title">EMI Calculator</h2>
              <div className="td-finance-grid">
                <div className="td-calc-section">
                  <div className="td-slider-block">
                    <div className="td-slider-top">
                      <label>Loan Amount</label>
                      <span className="td-slider-value">₹{financeAmount.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min="100000"
                      max={tataAceGoldDisplay ? tataAceGoldDisplay.price : tataAceGoldPlainDisplay ? tataAceGoldPlainDisplay.price : tata1512GLPTDisplay ? tata1512GLPTDisplay.price : tata1212LPTDisplay ? tata1212LPTDisplay.price : tata609GDisplay ? tata609GDisplay.price : tata709gLPTDisplay ? tata709gLPTDisplay.price : tata1109gLPTDisplay ? tata1109gLPTDisplay.price : eicherPro2110LDisplay ? eicherPro2110LDisplay.price : bajajMaximaCNGDisplay ? bajajMaximaCNGDisplay.price : parseFloat(truck.price)}
                      step="50000"
                      value={financeAmount}
                      onChange={(e) => setFinanceAmount(parseInt(e.target.value))}
                      className="td-slider"
                    />
                    <div className="td-slider-ends">
                      <span>₹1L</span>
                      <span>₹{shortPrice(truck.price)}</span>
                    </div>
                  </div>

                  <div className="td-slider-block">
                    <div className="td-slider-top">
                      <label>Down Payment</label>
                      <span className="td-slider-value">₹{initialPayment.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={financeAmount * 0.5}
                      step="25000"
                      value={initialPayment}
                      onChange={(e) => setInitialPayment(parseInt(e.target.value))}
                      className="td-slider"
                    />
                    <div className="td-slider-ends">
                      <span>₹0</span>
                      <span>₹{(financeAmount * 0.5).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="td-slider-block">
                    <div className="td-slider-top">
                      <label>Tenure</label>
                      <span className="td-slider-value">{loanPeriod} Months</span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="84"
                      step="12"
                      value={loanPeriod}
                      onChange={(e) => setLoanPeriod(parseInt(e.target.value))}
                      className="td-slider"
                    />
                    <div className="td-slider-ends">
                      <span>12 mo</span>
                      <span>84 mo</span>
                    </div>
                  </div>
                </div>

                <div className="td-emi-result">
                  <div className="td-emi-main-result">
                    <span className="td-emi-title">Monthly EMI</span>
                    <span className="td-emi-amount">₹{Math.round(monthlyEMI).toLocaleString()}</span>
                  </div>
                  <div className="td-emi-breakdown">
                    <div className="td-breakdown-row">
                      <span className="td-breakdown-dot principal"></span>
                      <span className="td-breakdown-label">Principal</span>
                      <span className="td-breakdown-value">₹{(financeAmount - initialPayment).toLocaleString()}</span>
                    </div>
                    <div className="td-breakdown-row">
                      <span className="td-breakdown-dot interest"></span>
                      <span className="td-breakdown-label">Interest ({rateOfInterest}%)</span>
                      <span className="td-breakdown-value">₹{Math.round(interestAmount).toLocaleString()}</span>
                    </div>
                    <div className="td-breakdown-row total">
                      <span className="td-breakdown-label">Total Payable</span>
                      <span className="td-breakdown-value">₹{Math.round((financeAmount - initialPayment) + interestAmount).toLocaleString()}</span>
                    </div>
                  </div>
                  <button className="td-check-eligibility">
                    Check Loan Eligibility
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                  <p className="td-disclaimer">*Subject to lender approval</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Why Axlerator */}
      <div className="td-advantages">
        <h2>Why Choose Axlerator</h2>
        <div className="td-advantages-grid">
          {axleratorAdvantages.map((adv, idx) => (
            <div key={idx} className="td-advantage-card" style={{ '--accent': adv.color } as React.CSSProperties}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <div>
                <span className="td-adv-title">{adv.title}</span>
                <span className="td-adv-desc">{adv.subtitle}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Similar Trucks */}
      {similarTrucks.length > 0 && (
        <div className="td-similar">
          <div className="td-similar-header">
            <h2>Similar Trucks</h2>
            <Link href="/browse-trucks" className="td-view-all">
              View All
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
          <div className="td-similar-grid">
            {similarTrucks.map((st) => (
              <Link href={`/truck/${st.id}`} key={st.id} className="td-similar-card">
                <div className="td-similar-img">
                  {(() => {
                    const isExternal = st.imageUrl?.includes('supabase.co') || st.imageUrl?.startsWith('http')
                    
                    if (isExternal) {
                      return (
                        <img
                          src={st.imageUrl}
                          alt={st.name}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            position: 'absolute',
                            top: 0,
                            left: 0
                          }}
                        />
                      )
                    }
                    
                    return (
                      <Image src={st.imageUrl} alt={st.name} fill style={{ objectFit: 'cover' }} />
                    )
                  })()}
                  <span className="td-similar-certified">Certified</span>
                </div>
                <div className="td-similar-info">
                  <h4>{st.year} {st.name}</h4>
                  <p>{st.kilometers?.toLocaleString()} km • Diesel • Manual</p>
                  <div className="td-similar-bottom">
                    <span className="td-similar-price">{displayPrice(st.price)}</span>
                    <span className="td-similar-cta">View Details</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Explore More */}
      <div className="td-explore">
        <h3>Explore More</h3>
        <div className="td-explore-links">
          <Link href={`/browse-trucks?brand=${truck.manufacturer}`}>More {truck.manufacturer} Trucks</Link>
          <Link href="/browse-trucks?priceMax=3000000">Trucks Under ₹30L</Link>
          <Link href="/browse-trucks">All Trucks</Link>
          <Link href="/sell-truck" className="highlight">Sell Your Truck</Link>
        </div>
      </div>

      {/* Full-image lightbox */}
      {lightboxOpen && gallery.length > 0 && (
        <div
          className="td-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${truck.name} image ${activeIndex + 1} of ${gallery.length}`}
          tabIndex={-1}
          ref={(el) => {
            if (el) {
              el.focus()
              document.body.style.overflow = 'hidden'
            } else {
              document.body.style.overflow = ''
            }
          }}
          onClick={() => setLightboxOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setLightboxOpen(false)
            if (e.key === 'ArrowLeft') {
              setSelectedImageIndex(activeIndex > 0 ? activeIndex - 1 : gallery.length - 1)
            }
            if (e.key === 'ArrowRight') {
              setSelectedImageIndex(activeIndex < gallery.length - 1 ? activeIndex + 1 : 0)
            }
          }}
        >
          <button
            className="td-lightbox-close"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>

          {gallery.length > 1 && (
            <>
              <button
                className="td-lightbox-nav prev"
                aria-label="Previous image"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedImageIndex(activeIndex > 0 ? activeIndex - 1 : gallery.length - 1)
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <button
                className="td-lightbox-nav next"
                aria-label="Next image"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedImageIndex(activeIndex < gallery.length - 1 ? activeIndex + 1 : 0)
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </>
          )}

          <div className="td-lightbox-stage" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const media = gallery[activeIndex]
              if (isVideoUrl(media)) {
                if (videoErrors[media]) {
                  return (
                    <div className="td-video-fallback">
                      <span className="td-video-fallback-icon" aria-hidden="true">▶</span>
                      <p>This browser can&apos;t play this video.</p>
                      <a href={media} target="_blank" rel="noopener noreferrer">
                        Open video in a new tab
                      </a>
                    </div>
                  )
                }
                return (
                  <video
                    key={media}
                    src={media}
                    controls
                    autoPlay
                    playsInline
                    crossOrigin="anonymous"
                    onError={() => setVideoErrors(prev => ({ ...prev, [media]: true }))}
                    className="td-lightbox-media"
                  />
                )
              }
              return (
                <img
                  src={media}
                  alt={`${truck.name} — image ${activeIndex + 1}`}
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  className="td-lightbox-media"
                />
              )
            })()}
          </div>

          <div className="td-lightbox-counter">
            {activeIndex + 1} / {gallery.length}
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactForm && (
        <div className="td-modal-overlay" onClick={() => setShowContactForm(false)}>
          <div className="td-modal" onClick={e => e.stopPropagation()}>
            <button className="td-modal-close" onClick={() => setShowContactForm(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
            <h2>Get Best Price</h2>
            <p>for {truck.year} {truck.name}</p>
            <form className="td-modal-form" onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const name = formData.get('name') as string
              const phone = formData.get('phone') as string
              const email = formData.get('email') as string
              
              try {
                const response = await fetch('/api/inquiries', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    truckId: truck.id,
                    truckName: `${truck.year} ${truck.name}`,
                    name,
                    email: email || '',
                    phone,
                    message: `Price inquiry for ${truck.year} ${truck.name}`
                  })
                })
                
                if (response.ok) {
                  alert('Thank you! We will contact you soon with the best price.')
                  setShowContactForm(false)
                  e.currentTarget.reset()
                } else {
                  alert('Failed to submit. Please try again.')
                }
              } catch (error) {
                console.error('Error submitting inquiry:', error)
                alert('Failed to submit. Please try again.')
              }
            }}>
              <input type="text" name="name" placeholder="Full Name" required />
              <input type="tel" name="phone" placeholder="Phone Number" required />
              <input type="email" name="email" placeholder="Email (Optional)" />
              <button type="submit">Submit Enquiry</button>
            </form>
          </div>
        </div>
      )}

      {/* Test Drive Booking Modal */}
      {showTestDriveForm && (
        <div className="td-modal-overlay" onClick={() => setShowTestDriveForm(false)}>
          <div className="td-modal" onClick={e => e.stopPropagation()}>
            <button className="td-modal-close" onClick={() => setShowTestDriveForm(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
            <h2>Book a Test Drive</h2>
            <p>for {truck.year} {truck.name}</p>
            <form className="td-modal-form" onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const name = formData.get('name') as string
              const phone = formData.get('phone') as string
              const email = formData.get('email') as string
              
              try {
                const response = await fetch('/api/inquiries', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    truckId: truck.id,
                    truckName: `${truck.year} ${truck.name}`,
                    name,
                    email: email || '',
                    phone,
                    message: `Test drive booking request for ${truck.year} ${truck.name}`
                  })
                })
                
                if (response.ok) {
                  alert('Thank you! We will contact you soon to schedule your test drive.')
                  setShowTestDriveForm(false)
                  e.currentTarget.reset()
                } else {
                  alert('Failed to submit. Please try again.')
                }
              } catch (error) {
                console.error('Error submitting test drive request:', error)
                alert('Failed to submit. Please try again.')
              }
            }}>
              <input type="text" name="name" placeholder="Full Name" required />
              <input type="tel" name="phone" placeholder="Phone Number" required />
              <input type="email" name="email" placeholder="Email (Optional)" />
              <button type="submit">Submit Enquiry</button>
            </form>
          </div>
        </div>
      )}

      {/* Full Report Modal */}
      {showFullReport && (
        <div className="td-report-modal-overlay" onClick={() => setShowFullReport(false)}>
          <div className="td-report-modal" onClick={e => e.stopPropagation()}>
            <div className="td-report-modal-header">
              <button className="td-report-back" onClick={() => setShowFullReport(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Truck Quality Report
              </button>
            </div>
            
            <div className="td-report-modal-hero">
              <div className="td-report-modal-info">
                <h2>{truck.year} {truck.name}</h2>
                <p>{truck.kilometers?.toLocaleString()} km • Diesel • Manual</p>
                <div className="td-assured-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  Assured
                  <span className="td-know-more">Know more</span>
                </div>
              </div>
              <div className="td-report-modal-image">
                {(() => {
                  const isExternal = truck.imageUrl?.includes('supabase.co') || truck.imageUrl?.startsWith('http')
                  
                  if (isExternal) {
                    return (
                      <img
                        src={truck.imageUrl}
                        alt={truck.name}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          position: 'absolute',
                          top: 0,
                          left: 0
                        }}
                      />
                    )
                  }
                  
                  return (
                    <Image src={truck.imageUrl} alt={truck.name} fill style={{ objectFit: 'cover' }} />
                  )
                })()}
              </div>
            </div>

            <div className="td-report-modal-content">
              <h4 className="td-modal-highlights-title">HIGHLIGHTS</h4>
              <div className="td-modal-highlights">
                {highlightsFor(truck).map((h, idx) => (
                  <div key={idx} className="td-modal-highlight">
                    <div className="td-modal-highlight-icon">
                      {h.icon === 'power' && (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.5">
                          <circle cx="12" cy="12" r="3"/>
                          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                        </svg>
                      )}
                      {h.icon === 'ac' && (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.5">
                          <path d="M12 2v10M12 12l8 4M12 12L4 16M12 12v10"/>
                          <path d="M17 7l-5 5-5-5"/>
                        </svg>
                      )}
                      {h.icon === 'fuel' && (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.5">
                          <path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/>
                          <path d="M3 10h12M7 22v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/>
                          <path d="M15 6h2a2 2 0 0 1 2 2v4l2 2v6h-2"/>
                        </svg>
                      )}
                    </div>
                    <span className="td-modal-highlight-label">{h.label}</span>
                    <span className="td-modal-highlight-desc">{h.desc}</span>
                  </div>
                ))}
              </div>

              <div className="td-modal-score-tabs">
                {Object.entries(inspectionData).map(([key, data]) => (
                  <button
                    key={key}
                    className={`td-modal-score-tab ${activeReportTab === key ? 'active' : ''}`}
                    onClick={() => setActiveReportTab(key)}
                  >
                    {data.label}
                    <span style={{ background: getScoreColor(data.score) }}>{data.score}</span>
                  </button>
                ))}
              </div>

              <button className="td-modal-scores-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                See how scores are calculated?
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>

              {/* Detailed Inspection Cards */}
              {Object.entries(inspectionData).map(([key, data]) => (
                <div key={key} className="td-modal-category">
                  <div className="td-modal-category-header">
                    <div className="td-modal-cat-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <path d="M3 9h18M9 21V9"/>
                      </svg>
                    </div>
                    <div className="td-modal-cat-info">
                      <span className="td-modal-cat-name">{data.label}</span>
                      <span className="td-modal-cat-parts">{data.parts} parts across {data.assemblies} assemblies</span>
                    </div>
                    <div className="td-modal-cat-score" style={{ background: getScoreColor(data.score) }}>
                      {data.score}
                      <small>{data.status}</small>
                    </div>
                  </div>
                  <div className="td-modal-cat-items">
                    {data.items.map((item, idx) => (
                      <div key={idx} className="td-modal-cat-item">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="#059669">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M8 12l2.5 2.5L16 9" stroke="white" strokeWidth="2" fill="none"/>
                        </svg>
                        <div className="td-modal-item-info">
                          <span className="td-modal-item-name">{item.name}{'score' in item && item.score ? `: ${item.score}` : ''}</span>
                          <span className="td-modal-item-status">{item.status}</span>
                        </div>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                          <path d="M9 18l6-6-6-6"/>
                        </svg>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Report OTP Modal */}
      {showReportOTPModal && (
        <div className="td-modal-overlay" onClick={() => setShowReportOTPModal(false)}>
          <div className="td-modal" onClick={e => e.stopPropagation()}>
            <button className="td-modal-close" onClick={() => setShowReportOTPModal(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <h2>Verify Phone to View Full Report</h2>
            <p>Enter your phone number to receive a one-time password (OTP) and unlock the detailed quality report.</p>

            <form
              className="td-modal-form"
              onSubmit={async (e) => {
                e.preventDefault()
                if (reportOTPStep === 'phone') {
                  await handleSendReportOTP()
                } else {
                  await handleVerifyReportOTP()
                }
              }}
            >
              {reportOTPStep === 'phone' && (
                <>
                  <input
                    type="tel"
                    name="report-phone"
                    placeholder="Phone Number"
                    value={reportPhone}
                    onChange={(e) => setReportPhone(e.target.value)}
                    required
                  />
                  <button type="submit" disabled={reportOTPLoading}>
                    {reportOTPLoading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </>
              )}

              {reportOTPStep === 'otp' && (
                <>
                  <input
                    type="tel"
                    name="report-otp"
                    placeholder="Enter 6-digit OTP"
                    value={reportOTP}
                    onChange={(e) => setReportOTP(e.target.value)}
                    required
                  />
                  <button type="submit" disabled={reportOTPLoading}>
                    {reportOTPLoading ? 'Verifying...' : 'Verify & View Report'}
                  </button>
                  <button
                    type="button"
                    className="td-secondary-link"
                    onClick={handleSendReportOTP}
                    disabled={reportOTPLoading}
                  >
                    Resend OTP
                  </button>
                </>
              )}

              {reportOTPError && (
                <p className="td-error-text" style={{ marginTop: '0.75rem' }}>
                  {reportOTPError}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
