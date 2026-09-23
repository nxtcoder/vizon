import { publicTruckImagesRoot, rewriteTruckImagesStorageUrlToCurrentProject } from '@/lib/supabase-storage'

const TATA_709G_LPT_LISTING_HERO_URL = '/trucks/tata-709g-lpt-hero.png'
const SML_ISUZU_ZT54_LISTING_HERO_URL = '/trucks/sml-isuzu-zt54-hero.png'
const EICHER_PRO_2110L_LISTING_HERO_URL = '/trucks/eicher-pro-2110l-hero.png'
const BAJAJ_MAXIMA_CNG_LISTING_HERO_URL = '/trucks/bajaj-maxima-cng-hero.png'
const TATA_ACE_GOLD_7908_LISTING_HERO_URL = '/trucks/tata-ace-gold-7908-hero.png'
const TATA_1512G_LPT_LISTING_HERO_URL = '/trucks/tata-1512g-lpt-hero.png'
const EICHER_PRO_1075_F_HSD_LISTING_HERO_URL = '/trucks/eicher-pro-1075-f-hsd-hero.png'
const TATA_1212_LPT_LISTING_HERO_URL = '/trucks/tata-1212-lpt-hero.png'
const TATA_609G_LISTING_HERO_URL = '/trucks/tata-609g-hero.png'
const TATA_1412_LPT_LISTING_HERO_URL = '/trucks/tata-1412-lpt-hero.png'
const MAHINDRA_BOLERO_MAXITRUCK_PLUS_LISTING_HERO_URL =
  '/trucks/mahindra-bolero-maxitruck-plus-hero.png'
const HR_55_X_4498_LISTING_HERO_URL = '/trucks/hr-55-x-4498-hero.png'
const HR_55_X_0253_LISTING_HERO_URL = '/trucks/hr-55-x-0253-hero.png'

/** Hero image for Eicher Pro 2110 / 2110L listings (vehicle photo, not RC/document). */
export const EICHER_PRO_2110_TRUCK_PHOTO_URL = `${publicTruckImagesRoot()}/1765093748367-Eicher_PRO_2110_WB_3900-5252-250807115200267.webp`

export function shouldUseEicherPro2110TruckPhotos(truck: {
  name?: string | null
  model?: string | null
  manufacturer?: string | null
}): boolean {
  if ((truck.manufacturer || '') !== 'Eicher Motors') return false
  const mu = (truck.model || '').toUpperCase()
  if (mu.includes('PRO 2110') || mu.includes('2110L')) return true
  const nl = (truck.name || '').toLowerCase()
  return nl.includes('2110') && nl.includes('2110l')
}

export function resolveTruckListImageUrl(truck: {
  name?: string | null
  model?: string | null
  manufacturer?: string | null
  imageUrl?: string | null
  image_url?: string | null
}): string {
  const raw = (truck.imageUrl ?? truck.image_url ?? '') || ''
  // For Tata Ace Gold (7908), homepage/browse cards should use the provided truck photo.
  if (shouldUseTataAceGold7908ListingHero(truck)) {
    return TATA_ACE_GOLD_7908_LISTING_HERO_URL
  }
  // For Eicher Pro 2110L, force the specific listing hero (not the default gallery photo).
  if (shouldUseEicherPro2110LListingHero(truck) && raw) {
    return EICHER_PRO_2110L_LISTING_HERO_URL
  }

  if (shouldUseEicherPro2110TruckPhotos(truck)) {
    return EICHER_PRO_2110_TRUCK_PHOTO_URL
  }

  // For Eicher Pro 1075 F HSD, use the provided truck-only image as the card hero.
  if (shouldUseEicherPro1075FHsdListingHero(truck) && raw) {
    return EICHER_PRO_1075_F_HSD_LISTING_HERO_URL
  }

  // For Tata 709 G LPT, home/browse cards were showing the first gallery image
  // (plate/RC-like). Swap to the next curated image so it doesn't appear on cards.
  if (shouldUseTata709gLptListingSecondHero(truck)) {
    return TATA_709G_LPT_LISTING_HERO_URL
  }

  // For SML Isuzu ZT54, the card hero must be the provided truck-only image.
  if (shouldUseSmlIsuzuZT54ListingHero(truck) && raw) {
    return SML_ISUZU_ZT54_LISTING_HERO_URL
  }

  // For Bajaj Maxima CNG, use the provided truck photo as the card hero.
  if (shouldUseBajajMaximaCngListingHero(truck)) {
    return BAJAJ_MAXIMA_CNG_LISTING_HERO_URL
  }

  // For Tata 1512G LPT, use the provided truck photo as the card hero.
  if (shouldUseTata1512gLptListingHero(truck)) {
    return TATA_1512G_LPT_LISTING_HERO_URL
  }

  // For Tata 1212 LPT, use the provided truck photo as the card hero.
  if (shouldUseTata1212LptListingHero(truck)) {
    return TATA_1212_LPT_LISTING_HERO_URL
  }

  // For Tata 609g, use the provided truck photo as the card hero.
  if (shouldUseTata609gListingHero(truck)) {
    return TATA_609G_LISTING_HERO_URL
  }

  // For Tata 1412 LPT, use the provided truck photo as the card hero.
  if (shouldUseTata1412LptListingHero(truck)) {
    return TATA_1412_LPT_LISTING_HERO_URL
  }

  // For Mahindra Bolero Maxitruck Plus, use the provided truck photo as the card hero.
  if (shouldUseMahindraBoleroMaxitruckPlusListingHero(truck)) {
    return MAHINDRA_BOLERO_MAXITRUCK_PLUS_LISTING_HERO_URL
  }

  // For HR 55 X 4498, use the provided truck photo as the card hero.
  if (shouldUseHr55X4498ListingHero(truck)) {
    return HR_55_X_4498_LISTING_HERO_URL
  }

  // For HR 55 X 0253, use the provided truck photo as the card hero.
  if (shouldUseHr55X0253ListingHero(truck)) {
    return HR_55_X_0253_LISTING_HERO_URL
  }

  // DB / API may still store the full URL from a previous Supabase project
  return rewriteTruckImagesStorageUrlToCurrentProject(raw)
}

function shouldUseTata709gLptListingSecondHero(truck: {
  name?: string | null
  model?: string | null
  manufacturer?: string | null
}): boolean {
  const m = (truck.manufacturer || '').toLowerCase()
  const n = (truck.name || '').toLowerCase()
  const mo = (truck.model || '').toLowerCase()

  const isTata = m.includes('tata')
  const has709 = n.includes('709') || mo.includes('709')
  const hasG = n.includes('709 g') || n.includes('709g') || mo.includes('709 g') || mo.includes('709g')
  const hasLpt = n.includes('lpt') || mo.includes('lpt')
  return isTata && has709 && hasG && hasLpt
}

function shouldUseSmlIsuzuZT54ListingHero(truck: {
  name?: string | null
  model?: string | null
  manufacturer?: string | null
}): boolean {
  const m = (truck.manufacturer || '').toLowerCase()
  const n = (truck.name || '').toLowerCase()
  const mo = (truck.model || '').toLowerCase()

  const isSml = m.includes('sml') || n.includes('sml')
  const hasZt54 = n.includes('zt54') || mo.includes('zt54') || n.includes('zt 54') || mo.includes('zt 54')
  return isSml && hasZt54
}

function shouldUseBajajMaximaCngListingHero(truck: {
  name?: string | null
  model?: string | null
  manufacturer?: string | null
}): boolean {
  const m = (truck.manufacturer || '').toLowerCase()
  const n = (truck.name || '').toLowerCase()
  const mo = (truck.model || '').toLowerCase()

  const haystack = `${m} ${n} ${mo}`
  return haystack.includes('bajaj') && haystack.includes('maxima') && haystack.includes('cng')
}

function shouldUseTata609gListingHero(truck: {
  name?: string | null
  model?: string | null
  manufacturer?: string | null
}): boolean {
  const m = (truck.manufacturer || '').toLowerCase()
  const n = (truck.name || '').toLowerCase()
  const mo = (truck.model || '').toLowerCase()

  const haystack = `${m} ${n} ${mo}`.replace(/\s+/g, ' ')
  return haystack.includes('tata') && (haystack.includes('609g') || haystack.includes('609 g')) && !haystack.includes('lpt')
}

function shouldUseTata1412LptListingHero(truck: {
  name?: string | null
  model?: string | null
  manufacturer?: string | null
}): boolean {
  // Truck 37 only ("1412G LPT"): other Tata 1412s, like 57 and 59, have their own photos.
  const n = (truck.name || '').toLowerCase().trim()
  const mo = (truck.model || '').toLowerCase()
  return n === 'tata 1412 lpt' || mo.includes('1412g lpt')
}

function shouldUseMahindraBoleroMaxitruckPlusListingHero(truck: {
  name?: string | null
  model?: string | null
  manufacturer?: string | null
  imageUrl?: string | null
  image_url?: string | null
}): boolean {
  const m = (truck.manufacturer || '').toLowerCase()
  const n = (truck.name || '').toLowerCase()
  const mo = (truck.model || '').toLowerCase()
  const haystack = `${m} ${n} ${mo}`.replace(/\s+/g, ' ')
  // The hero is truck 41's photo. 46 and 47 are Bolero Maxitrucks too, so the
  // truck's own folder (or the hero, once resolved) decides, not the name.
  const img = (truck.imageUrl ?? truck.image_url ?? '').toLowerCase()
  const isTruck41 = img.includes('/mahindra_bolero_maxitruck_plus/') || img.includes('mahindra-bolero-maxitruck-plus-hero')
  return isTruck41 && haystack.includes('mahindra') && haystack.includes('bolero')
}

function normalizeReg(v: string): string {
  return (v || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function shouldUseHr55X4498ListingHero(truck: {
  name?: string | null
  model?: string | null
  manufacturer?: string | null
  imageUrl?: string | null
  image_url?: string | null
}): boolean {
  // The plate is no longer the name, but it is in the photo folder (and in the hero's own path).
  return normalizeReg(truck.imageUrl ?? truck.image_url ?? '').includes('hr55x4498')
}

function shouldUseHr55X0253ListingHero(truck: {
  name?: string | null
  model?: string | null
  manufacturer?: string | null
  imageUrl?: string | null
  image_url?: string | null
}): boolean {
  // The plate is no longer the name, but it is in the photo folder (and in the hero's own path).
  return normalizeReg(truck.imageUrl ?? truck.image_url ?? '').includes('hr55x0253')
}

function shouldUseEicherPro1075FHsdListingHero(truck: {
  name?: string | null
  model?: string | null
  manufacturer?: string | null
}): boolean {
  const n = (truck.name || '').toLowerCase()
  const mo = (truck.model || '').toLowerCase()
  const haystack = `${n} ${mo}`.replace(/\s+/g, ' ')
  return haystack.includes('1075') && (haystack.includes('hsd') || haystack.includes('f hsd'))
}

function shouldUseTata1512gLptListingHero(truck: {
  name?: string | null
  model?: string | null
  manufacturer?: string | null
}): boolean {
  const n = (truck.name || '').toLowerCase()
  const mo = (truck.model || '').toLowerCase()
  const haystack = `${n} ${mo}`.replace(/\s+/g, ' ')
  return haystack.includes('tata') && haystack.includes('1512') && haystack.includes('lpt')
}

function shouldUseTata1212LptListingHero(truck: {
  name?: string | null
  model?: string | null
  manufacturer?: string | null
}): boolean {
  const n = (truck.name || '').toLowerCase()
  const mo = (truck.model || '').toLowerCase()
  const haystack = `${n} ${mo}`.replace(/\s+/g, ' ')
  return haystack.includes('tata') && haystack.includes('1212') && haystack.includes('lpt')
}

function shouldUseTataAceGold7908ListingHero(truck: {
  name?: string | null
  model?: string | null
  manufacturer?: string | null
  imageUrl?: string | null
  image_url?: string | null
}): boolean {
  const n = (truck.name || '').toLowerCase()
  const mo = (truck.model || '').toLowerCase()
  const haystack = `${n} ${mo}`
  // Since 24 Sep 2026 the name no longer says "(7908)"; its folder still does.
  const img = (truck.imageUrl ?? truck.image_url ?? '').toLowerCase()
  const byFolder = img.includes('/tata_ace_gold_7908/') || img.includes('tata-ace-gold-7908-hero')
  return byFolder || (haystack.includes('tata ace gold') && haystack.includes('7908'))
}

function shouldUseEicherPro2110LListingHero(truck: {
  name?: string | null
  model?: string | null
  manufacturer?: string | null
}): boolean {
  const mu = (truck.model || '').toUpperCase()
  if (mu.includes('2110L')) return true

  const n = (truck.name || '').toLowerCase()
  const compactName = n.replace(/\s+/g, '')
  return compactName.includes('2110l')
}

/** Truck display name from API query (folder resolution uses this). */
export function isEicherPro2110LTruckName(truckName: string): boolean {
  const n = (truckName || '').toLowerCase().trim()
  return n.includes('2110') && n.includes('2110l')
}

/**
 * True if a storage filename or public URL looks like an RC / permit / portal screenshot,
 * not an exterior truck photo. Used only for Eicher Pro 2110L galleries.
 */
export function isLikelyRegistrationOrPermitUpload(pathOrUrl: string): boolean {
  const t = decodeURIComponent(pathOrUrl).toLowerCase()

  const hardExclude = ['mh01dr0730', 'mh01_dr_0730', 'mh01-dr-0730']
  if (hardExclude.some((s) => t.includes(s))) return true

  const portalHints = [
    'vahan',
    'parivahan',
    'mparivahan',
    'digilocker',
    'sarathi',
    'vehicle_registration',
    'registration_certificate',
    'registration-cert',
    'rc_book',
    'rcbook',
    'fitness_certificate',
    'fitness-cert',
    'pucc_cert',
    'pollution_under',
    'permit_copy',
    'national_permit',
    'noc_',
    'm-parivahan',
  ]
  if (portalHints.some((s) => t.includes(s))) return true

  if (/\brc[_\-.]|\brc_screen|rc_screenshot|screenshot.*\brc\b|[_-]rc\.(jpg|jpeg|png|webp)$/i.test(t)) {
    return true
  }

  return false
}

/** Drop document-style screenshots; if everything would be removed, keep originals (caller may still prefer truck-only fallbacks). */
export function filterEicherPro2110LDocumentScreenshotsFromUrls(urls: string[]): string[] {
  const filtered = urls.filter((u) => !isLikelyRegistrationOrPermitUpload(u))
  return filtered.length > 0 ? filtered : urls
}
