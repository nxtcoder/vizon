import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import {
  filterEicherPro2110LDocumentScreenshotsFromUrls,
  isEicherPro2110LTruckName,
  isLikelyRegistrationOrPermitUpload,
} from '@/lib/truck-listing-images'
import { collectPublicTruckMediaUrls } from '@/lib/truck-images-collect'
import { rewriteTruckImagesStorageUrls, truckImagesFolderFromUrl } from '@/lib/supabase-storage'

const BUCKET_NAME = 'truck-images'

// Helper: create Supabase client (anon key – may be blocked by Storage RLS)
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Helper: create Supabase admin client (service role – bypasses RLS, use only server-side)
// Use this for Storage so list() and file access work even when bucket policies restrict anon
function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) return null
  return createClient(supabaseUrl, serviceRoleKey)
}

// Helper function to get mapping file name for a truck
function getMappingFileName(truckName: string): string | null {
    // Map truck names to their mapping file names (without path)
    const mappingFileNames: Record<string, string> = {
      'Tata 1109g LPT': 'tata-1109g-image-mapping.json',
      'TATA MOTORS 1109G LPT': 'tata-1109g-image-mapping.json',
      'Tata Motors 1109g LPT': 'tata-1109g-image-mapping.json',
      'TATA 1109G LPT': 'tata-1109g-image-mapping.json',
      'Tata 1412 LPT': 'tata-1412-image-mapping.json',
      'ASHOK LEYLAND ECOMET STAR 1415 HE': 'ashok-leyland-image-mapping.json',
      'ASHOK LEYLAND ECOMET STAR 1615 HE': 'ashok-leyland-1615-image-mapping.json',
      'Mahindra Bolero Maxitruck Plus': 'mahindra-bolero-image-mapping.json',
      'SML Isuzu Samrat 4760gs': 'sml-isuzu-image-mapping.json',
      'Tata 609g': 'tata-609g-image-mapping.json',
      'TATA 609G': 'tata-609g-image-mapping.json',
      'Tata Motors 609g': 'tata-609g-image-mapping.json',
      'Tata 609 g': 'tata-609g-image-mapping.json',
      'TATA 609 G': 'tata-609g-image-mapping.json',
      'Tata 609 G': 'tata-609g-image-mapping.json',
      'Tata 709g LPT': 'tata-709g-lpt-image-mapping.json',
      'TATA 709G LPT': 'tata-709g-lpt-image-mapping.json',
      'Tata Motors 709g LPT': 'tata-709g-lpt-image-mapping.json',
      'Tata 709 g LPT': 'tata-709g-lpt-image-mapping.json',
      'Tata 709 G LPT': 'tata-709g-lpt-image-mapping.json',
      'TATA 709 G LPT': 'tata-709g-lpt-image-mapping.json',
      'EICHER PRO 1075 F HSD': 'eicher-pro-1075-f-hsd-image-mapping.json',
      'Eicher Pro 1075 F HSD': 'eicher-pro-1075-f-hsd-image-mapping.json',
      'Eicher Motors Pro 1075 F HSD': 'eicher-pro-1075-f-hsd-image-mapping.json',
      'Eicher 1075 F HSD': 'eicher-pro-1075-f-hsd-image-mapping.json',
      'Eicher 2059': 'eicher-2059xp-image-mapping.json',
      'EICHER 2059': 'eicher-2059xp-image-mapping.json',
      'Eicher Motors 2059': 'eicher-2059xp-image-mapping.json',
      'Eicher 2059XP': 'eicher-2059xp-image-mapping.json',
      'EICHER 2059XP': 'eicher-2059xp-image-mapping.json',
      'Eicher Motors 2059XP': 'eicher-2059xp-image-mapping.json',
      'Eicher Pro 2059XP': 'eicher-2059xp-image-mapping.json',
      'EICHER PRO 2059XP': 'eicher-2059xp-image-mapping.json',
      'Eicher Pro 2059': 'eicher-2059xp-image-mapping.json',
      'EICHER PRO 2059': 'eicher-2059xp-image-mapping.json',
    }
    
    // Try to get the mapping file name
    let fileName = mappingFileNames[truckName]
    
    // Fallback matching for variations
    if (!fileName) {
      const normalizedName = truckName.toLowerCase()
      if (normalizedName.includes('1109') && normalizedName.includes('lpt')) {
        fileName = 'tata-1109g-image-mapping.json'
      } else if ((normalizedName.includes('609g') || normalizedName.includes('609 g')) && normalizedName.includes('tata')) {
        fileName = 'tata-609g-image-mapping.json'
      } else if ((normalizedName.includes('709g') || normalizedName.includes('709 g')) && normalizedName.includes('lpt') && normalizedName.includes('tata')) {
        fileName = 'tata-709g-lpt-image-mapping.json'
      } else if (normalizedName.includes('1075') && normalizedName.includes('hsd') && normalizedName.includes('eicher')) {
        fileName = 'eicher-pro-1075-f-hsd-image-mapping.json'
      } else if (normalizedName.includes('2059') && normalizedName.includes('eicher')) {
        fileName = 'eicher-2059xp-image-mapping.json'
      }
    }
  
  return fileName || null
}

// Helper function to load images from mapping file
async function loadImagesFromMapping(truckName: string, baseUrl?: string): Promise<string[]> {
  const fileName = getMappingFileName(truckName)
    
    if (!fileName) {
      console.log(`[API] No mapping file configured for truck: ${truckName}`)
      return []
    }
    
  // In production (serverless), file system access is limited, so prioritize public URL fetching
  // Try public URL first (works in production)
  if (baseUrl) {
    try {
      // Ensure baseUrl doesn't have trailing slash and fileName doesn't have leading slash
      const cleanBaseUrl = baseUrl.replace(/\/$/, '')
      const cleanFileName = fileName.replace(/^\//, '')
      const publicUrl = `${cleanBaseUrl}/${cleanFileName}`
      console.log(`[API] Attempting to fetch mapping file from public URL: ${publicUrl}`)
      
      // Create timeout controller for fetch
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // Increased timeout
      
      const response = await fetch(publicUrl, {
        // Add cache control to prevent stale data
        cache: 'no-store',
        // Add timeout
        signal: controller.signal,
        // Add headers to help with CORS if needed
        headers: {
          'Accept': 'application/json',
        }
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const mapping = await response.json()
        if (Array.isArray(mapping)) {
          const urls = rewriteTruckImagesStorageUrls(
            mapping.map((item: any) => item.supabaseUrl || item.url).filter(Boolean)
          )
          console.log(`[API] Successfully loaded ${urls.length} URLs from public URL`)
          return urls
        } else {
          console.warn(`[API] Mapping file from public URL is not an array, got:`, typeof mapping)
        }
      } else {
        console.log(`[API] Public URL fetch failed with status: ${response.status} ${response.statusText}`)
        const text = await response.text().catch(() => '')
        console.log(`[API] Response body: ${text.substring(0, 200)}`)
      }
    } catch (error: any) {
      console.error(`[API] Error fetching mapping file from public URL:`, error?.message || error)
      if (error.name === 'AbortError') {
        console.error(`[API] Request timed out after 10 seconds`)
      }
    }
  }
  
  // Fallback: Try file system (works in dev and if files are included in build)
  // This might fail in serverless environments, which is fine - we'll fall back to Supabase
    const possiblePaths = [
      join(process.cwd(), fileName), // Root directory
      join(process.cwd(), 'public', fileName), // Public folder
    ]
    
    for (const mappingFile of possiblePaths) {
    try {
      if (existsSync(mappingFile)) {
          console.log(`[API] Reading mapping file from: ${mappingFile}`)
          const fileContent = readFileSync(mappingFile, 'utf-8')
          const mapping = JSON.parse(fileContent)
          
          if (Array.isArray(mapping)) {
            const urls = rewriteTruckImagesStorageUrls(
              mapping.map((item: any) => item.supabaseUrl || item.url).filter(Boolean)
            )
          console.log(`[API] Successfully loaded ${urls.length} URLs from file system`)
            return urls
          }
          
          console.warn(`[API] Mapping file is not an array: ${mappingFile}`)
      }
    } catch (error: any) {
      // File system access might fail in serverless environments - this is expected
      console.log(`[API] File system read failed (expected in production): ${error?.message || error}`)
      // Continue to next path or return empty
    }
  }
  
    return []
}

// Map truck names to their folder names in Supabase Storage
const TRUCK_FOLDER_MAP: Record<string, string> = {
  'Tata 1109g LPT': 'TATA_1109G_LPT',
  'Tata 1412 LPT': 'TATA_1412_LPT',
  'ASHOK LEYLAND ECOMET STAR 1415 HE': 'ASHOK_LEYLAND_ECOMET_STAR_1415_HE',
  'ASHOK LEYLAND ECOMET STAR 1615 HE': 'ASHOK_LEYLAND_ECOMET_STAR_1615_HE',
  'Mahindra Bolero Maxitruck Plus': 'MAHINDRA_BOLERO_MAXITRUCK_PLUS',
  'SML Isuzu Samrat 4760gs': 'SML_ISUZU_SAMRAT_4760GS',
  'Tata 609g': 'TATA_609G',
  'TATA 609G': 'TATA_609G',
  'Tata Motors 609g': 'TATA_609G',
  'Tata 609 g': 'TATA_609G',
  'TATA 609 G': 'TATA_609G',
  'Tata 609 G': 'TATA_609G',
  'Tata 709g LPT': 'TATA_709G_LPT',
  'TATA 709G LPT': 'TATA_709G_LPT',
  'Tata Motors 709g LPT': 'TATA_709G_LPT',
  'Tata 709 g LPT': 'TATA_709G_LPT',
  'Tata 709 G LPT': 'TATA_709G_LPT',
  'TATA 709 G LPT': 'TATA_709G_LPT',
  'EICHER PRO 1075 F HSD': 'EICHER_PRO_1075_F_HSD',
  'Eicher Pro 1075 F HSD': 'EICHER_PRO_1075_F_HSD',
  'Eicher Motors Pro 1075 F HSD': 'EICHER_PRO_1075_F_HSD',
  'Eicher 1075 F HSD': 'EICHER_PRO_1075_F_HSD',
  'Eicher 2059': 'EICHER_2059XP',
  'EICHER 2059': 'EICHER_2059XP',
  'Eicher Motors 2059': 'EICHER_2059XP',
  'Eicher 2059XP': 'EICHER_2059XP',
  'EICHER 2059XP': 'EICHER_2059XP',
  'Eicher Motors 2059XP': 'EICHER_2059XP',
  'Eicher Pro 2059XP': 'EICHER_2059XP',
  'EICHER PRO 2059XP': 'EICHER_2059XP',
  'Eicher Pro 2059': 'EICHER_2059XP',
  'EICHER PRO 2059': 'EICHER_2059XP',
}

// Helper function to find folder name with flexible matching
function getFolderName(truckName: string): string | null {
  // Exact match first
  if (TRUCK_FOLDER_MAP[truckName]) {
    return TRUCK_FOLDER_MAP[truckName]
  }
  
  // Check for Tata 609g variations (case-insensitive, with/without space)
  const normalizedName = truckName.toLowerCase().trim()
  // More flexible matching for Tata 609g - check for "609" and "tata" separately
  if ((normalizedName.includes('609') || normalizedName.includes('609g') || normalizedName.includes('609 g')) && 
      (normalizedName.includes('tata') || normalizedName.includes('tata motors'))) {
    console.log(`[getFolderName] Matched Tata 609g: "${truckName}" -> TATA_609G`)
    return 'TATA_609G'
  }
  
  // Check for Tata 709g LPT variations (case-insensitive, with/without space)
  if ((normalizedName.includes('709g') || normalizedName.includes('709 g')) && normalizedName.includes('lpt') && normalizedName.includes('tata')) {
    return 'TATA_709G_LPT'
  }
  
  // Check for Eicher Pro 1075 F HSD variations (case-insensitive)
  if (normalizedName.includes('1075') && normalizedName.includes('hsd') && normalizedName.includes('eicher')) {
    return 'EICHER_PRO_1075_F_HSD'
  }
  
  // Check for Eicher 2059 variations (case-insensitive, with/without "Pro", with/without "XP")
  if (normalizedName.includes('2059') && normalizedName.includes('eicher')) {
    return 'EICHER_2059XP'
  }
  
  // Check for Tata 1109g LPT variations
  if (normalizedName.includes('1109') && normalizedName.includes('lpt') && normalizedName.includes('tata')) {
    return 'TATA_1109G_LPT'
  }
  
  // Check for Tata 1412 LPT variations
  if (normalizedName.includes('1412') && normalizedName.includes('lpt') && normalizedName.includes('tata')) {
    return 'TATA_1412_LPT'
  }
  
  // Check for Ashok Leyland variations
  if (normalizedName.includes('ashok') && normalizedName.includes('leyland')) {
    if (normalizedName.includes('1615')) {
      // Two distinct trucks exist for 1615:
      //  - "ASHOK LEYLAND ECOMET STAR 1615 HE"  (with space before HE) -> ..._1615_HE
      //  - "Ashok Leyland Ecomet Star 1615HE"    (no space before HE)   -> ..._1615HE
      if (normalizedName.includes('1615 he')) {
        return 'ASHOK_LEYLAND_ECOMET_STAR_1615_HE'
      }
      return 'ASHOK_LEYLAND_ECOMET_STAR_1615HE'
    } else if (normalizedName.includes('1415')) {
      return 'ASHOK_LEYLAND_ECOMET_STAR_1415_HE'
    }
  }
  
  // Check for Mahindra Bolero variations
  if (normalizedName.includes('mahindra') && normalizedName.includes('bolero')) {
    return 'MAHINDRA_BOLERO_MAXITRUCK_PLUS'
  }
  
  // Check for SML Isuzu variations
  if ((normalizedName.includes('sml') || normalizedName.includes('isuzu')) && normalizedName.includes('samrat')) {
    return 'SML_ISUZU_SAMRAT_4760GS'
  }
  
  // Fallback: Try to construct folder name from truck name
  // Convert truck name to uppercase and replace spaces/special chars with underscores
  const fallbackFolderName = truckName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  
  if (fallbackFolderName) {
    console.log(`[API] Using fallback folder name: ${fallbackFolderName} for truck: ${truckName}`)
    return fallbackFolderName
  }
  
  return null
}

export async function GET(request: Request) {
  try {
    console.log(`[API] truck-images route called`)
    console.log(`[API] NODE_ENV: ${process.env.NODE_ENV}`)
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'Supabase not configured', details: 'Missing NEXT_PUBLIC_SUPABASE_URL' },
        { status: 500 }
      )
    }
    
    // Prefer service role for Storage so list() works even when bucket RLS restricts anon key
    const supabase = getSupabaseAdminClient() || getSupabaseClient()
    if (!supabase) {
      console.error('[API] Supabase client not initialized. Set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env')
      return NextResponse.json(
        { 
          error: 'Supabase not configured', 
          details: 'Set NEXT_PUBLIC_SUPABASE_ANON_KEY in .env. For Storage listing, set SUPABASE_SERVICE_ROLE_KEY (server-side only).',
          hint: 'Copy .env.example to .env and add your Supabase keys. Service role key bypasses Storage RLS.'
        },
        { status: 500 }
      )
    }
    
    console.log(`[API] Supabase client initialized (admin: ${!!getSupabaseAdminClient()})`)
    
    const { searchParams } = new URL(request.url)
    const truckName = searchParams.get('truckName')
    // Optional hints: uploads are often foldered by registration number, not truck name.
    const imageUrlHint = searchParams.get('imageUrl')
    const registrationNumberHint = searchParams.get('registrationNumber')
    const debug = searchParams.get('debug') === '1' || searchParams.get('debug') === 'true'
    
    if (!truckName) {
      console.error('[API] No truckName parameter provided')
      return NextResponse.json(
        { error: 'Truck name is required. Use ?truckName=Tata%20Ace%20Gold%20(7908)' },
        { status: 400 }
      )
    }

    const decodedTruckName = decodeURIComponent(truckName).trim()
    const siteBaseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
      ''
    console.log(`[API] Fetching images for truck: "${decodedTruckName}"`)
    
    // PRIMARY: Fetch directly from Supabase Storage (where images are actually stored)
    // This is the most reliable source since images are uploaded there
    console.log(`[API] Fetching images from Supabase Storage (primary source)...`)
    
    // First, list all available folders to see what we have
    console.log(`[API] Listing all available folders in bucket...`)
    const { data: allFolders, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', {
        limit: 1000
      })

    if (listError) {
      console.error('[API] Error listing root folders:', listError)
      console.error('[API] Error details:', JSON.stringify(listError, null, 2))
      const err = listError as { statusCode?: number; message: string }
      console.error('[API] Error code:', err.statusCode)
      console.error('[API] Error message:', err.message)

      // Fallback path: when Supabase DNS/network is temporarily unavailable in local env,
      // still return mapping-based URLs instead of hard failing truck details.
      const mappingFallback = rewriteTruckImagesStorageUrls(
        await loadImagesFromMapping(decodedTruckName, siteBaseUrl || undefined)
      )
      if (mappingFallback.length > 0) {
        const imagesForResponse = isEicherPro2110LTruckName(decodedTruckName)
          ? filterEicherPro2110LDocumentScreenshotsFromUrls(mappingFallback)
          : mappingFallback
        return NextResponse.json({
          images: imagesForResponse,
          count: imagesForResponse.length,
          folder: null,
          source: 'mapping-dns-fallback',
          warning: 'Supabase Storage unreachable; served mapping fallback',
        })
      }

      return NextResponse.json({
        images: [],
        count: 0,
        folder: null,
        source: 'supabase-unreachable',
        warning: 'Failed to access Supabase Storage and no mapping fallback found',
        details: err.message,
      })
    }

    // Supabase list('') returns both files and folder-like prefixes; treat as folder if no file extension
    const hasFileExtension = (name: string) => /\.(jpg|jpeg|png|gif|webp|mp4|mov|pdf|json)$/i.test(name)
    const availableFolders = (allFolders || [])
      .map(f => f.name)
      .filter(name => !hasFileExtension(name))
    console.log(`[API] Available folders (${availableFolders.length}):`, availableFolders.slice(0, 20).join(', '))
    console.log(`[API] Looking for folder for truck: "${decodedTruckName}"`)
    console.log(`[API] Available folders include TATA_609G: ${availableFolders.includes('TATA_609G')}`)

    // Get the folder name for this truck (with flexible matching)
    let folderName = getFolderName(decodedTruckName)
    console.log(`[API] Initial folder name from mapping: ${folderName || 'null'}`)
    
    // Special check for Tata 609g - if folder exists, use it directly
    if (!folderName && availableFolders.includes('TATA_609G')) {
      const normalizedName = decodedTruckName.toLowerCase().trim()
      if (normalizedName.includes('609') && (normalizedName.includes('tata') || normalizedName.includes('tata motors'))) {
        folderName = 'TATA_609G'
        console.log(`[API] ✅ Direct match: Using TATA_609G folder for "${decodedTruckName}"`)
      }
    }
    
    // If folder name not found in mapping, try to find a matching folder
    if (!folderName) {
      console.log(`[API] Truck not in mapping, searching for matching folder...`)
      
      // Explicit match for "Tata Ace Gold (7908)" -> folder "Tata Ace Gold (7908)-20260307T052536Z-1-001"
      const truckLower = decodedTruckName.toLowerCase()
      if (truckLower.includes('tata') && truckLower.includes('ace') && truckLower.includes('7908')) {
        const aceFolder = availableFolders.find(f => {
          const fl = f.toLowerCase()
          return (fl.includes('tata') && fl.includes('ace') && (fl.includes('7908') || fl.includes('ace gold')))
        })
        if (aceFolder) {
          folderName = aceFolder
          console.log(`[API] ✅ Found Tata Ace Gold folder: ${folderName} for truck: ${decodedTruckName}`)
        }
      }
      
      if (!folderName) {
        // Try to find a folder that matches the truck name
        const normalizedTruckName = decodedTruckName.toLowerCase().replace(/[^a-z0-9]/g, '')
        console.log(`[API] Normalized truck name: "${normalizedTruckName}"`)
        
        for (const folder of availableFolders) {
          const normalizedFolder = folder.toLowerCase().replace(/[^a-z0-9]/g, '')
          
          // Check if folder name contains key parts of truck name or vice versa
          const matches = normalizedFolder.includes(normalizedTruckName) || 
              normalizedTruckName.includes(normalizedFolder) ||
              // Check for common patterns
              (normalizedTruckName.includes('609') && normalizedFolder.includes('609')) ||
              (normalizedTruckName.includes('709') && normalizedFolder.includes('709')) ||
              (normalizedTruckName.includes('1109') && normalizedFolder.includes('1109')) ||
              (normalizedTruckName.includes('1412') && normalizedFolder.includes('1412')) ||
              (normalizedTruckName.includes('2059') && normalizedFolder.includes('2059')) ||
              (normalizedTruckName.includes('1075') && normalizedFolder.includes('1075')) ||
              (normalizedTruckName.includes('7908') && normalizedFolder.includes('7908'))
          
          if (matches) {
            folderName = folder
            console.log(`[API] ✅ Found matching folder: ${folderName} for truck: ${decodedTruckName}`)
            break
          }
        }
      }
    }
    
    // If still no folder found, try fallback construction
    if (!folderName) {
      const fallbackFolderName = decodedTruckName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
      
      console.log(`[API] Trying fallback folder name: "${fallbackFolderName}"`)
      
      // Check if fallback folder exists
      if (availableFolders.includes(fallbackFolderName)) {
        folderName = fallbackFolderName
        console.log(`[API] ✅ Using fallback folder name: ${folderName}`)
      } else {
        // Try case-insensitive match
        const foundFolder = availableFolders.find(f => f.toUpperCase() === fallbackFolderName)
        if (foundFolder) {
          folderName = foundFolder
          console.log(`[API] ✅ Found case-insensitive match: ${folderName}`)
        }
      }
    }
    
    if (!folderName) {
      console.error(`[API] Could not find folder for truck: ${decodedTruckName}`)
      console.log(`[API] Available folders (${availableFolders.length}):`, availableFolders.join(', '))

      const mappingOnly = rewriteTruckImagesStorageUrls(
        await loadImagesFromMapping(decodedTruckName, siteBaseUrl || undefined)
      )
      if (mappingOnly.length > 0) {
        const imagesForResponse = isEicherPro2110LTruckName(decodedTruckName)
          ? filterEicherPro2110LDocumentScreenshotsFromUrls(mappingOnly)
          : mappingOnly
        return NextResponse.json({
          images: imagesForResponse,
          count: imagesForResponse.length,
          folder: null,
          source: 'mapping-no-storage-folder',
          truckName: decodedTruckName,
        })
      }

      return NextResponse.json(
        { 
          error: 'Truck folder not found in Supabase Storage', 
          truckName: decodedTruckName,
          availableFoldersCount: availableFolders.length,
          availableFolders: debug ? availableFolders : availableFolders.slice(0, 30),
          hint: 'Folder name in Storage must match truck name. Add ?debug=1 to see all folders. Ensure SUPABASE_SERVICE_ROLE_KEY is in .env for listing.'
        },
        { status: 404 }
      )
    }

    console.log(`[API] Using folder: ${folderName}`)

    let effectiveFolder = folderName
    let imageSource:
      | 'supabase-storage'
      | 'supabase-hinted-folder'
      | 'supabase-alternative-folder'
      | 'mapping-fallback' = 'supabase-storage'

    let imageUrls = rewriteTruckImagesStorageUrls(await collectPublicTruckMediaUrls(supabase, folderName))

    // Folders hinted by the truck record itself (hero image path / registration number).
    // Uploads are commonly stored under a registration-number folder, which never matches the truck name.
    const hintedFolders = [
      truckImagesFolderFromUrl(imageUrlHint),
      registrationNumberHint?.trim() || null,
      registrationNumberHint?.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_') || null,
    ]
      .filter((f): f is string => !!f && f !== folderName)
      .filter((f, i, arr) => arr.indexOf(f) === i)

    const flatListMediaUrls = async (storagePrefix: string): Promise<string[]> => {
      const { data: files, error } = await supabase.storage.from(BUCKET_NAME).list(storagePrefix, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      })
      if (error || !files?.length) return []
      return rewriteTruckImagesStorageUrls(
        files
          .filter((file) => {
            const ext = file.name.toLowerCase()
            return (
              ext.endsWith('.jpg') ||
              ext.endsWith('.jpeg') ||
              ext.endsWith('.png') ||
              ext.endsWith('.webp') ||
              ext.endsWith('.gif') ||
              ext.endsWith('.mp4') ||
              ext.endsWith('.mov')
            )
          })
          .filter((file) => {
            if (
              isEicherPro2110LTruckName(decodedTruckName) &&
              isLikelyRegistrationOrPermitUpload(file.name)
            ) {
              return false
            }
            return true
          })
          .map((file) => {
            const filePath = `${storagePrefix}/${file.name}`
            const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)
            return data.publicUrl
          })
      )
    }

    if (imageUrls.length === 0) {
      imageUrls = await flatListMediaUrls(folderName)
    }

    if (imageUrls.length === 0) {
      for (const hinted of hintedFolders) {
        const hintedUrls = rewriteTruckImagesStorageUrls(
          await collectPublicTruckMediaUrls(supabase, hinted)
        )
        const urls = hintedUrls.length > 0 ? hintedUrls : await flatListMediaUrls(hinted)
        if (urls.length > 0) {
          imageUrls = urls
          effectiveFolder = hinted
          imageSource = 'supabase-hinted-folder'
          console.log(`[API] Found ${urls.length} images in hinted folder: ${hinted}`)
          break
        }
      }
    }

    if (imageUrls.length === 0) {
      const prefix = decodedTruckName.toLowerCase().substring(0, 5)
      for (const folder of availableFolders) {
        if (folder === folderName) continue
        if (!folder.toLowerCase().includes(prefix)) continue
        const alt = rewriteTruckImagesStorageUrls(await collectPublicTruckMediaUrls(supabase, folder))
        const urls = alt.length > 0 ? alt : await flatListMediaUrls(folder)
        if (urls.length > 0) {
          imageUrls = urls
          effectiveFolder = folder
          imageSource = 'supabase-alternative-folder'
          console.log(`[API] Found ${urls.length} images in alternative folder: ${folder}`)
          break
        }
      }
    }

    if (imageUrls.length === 0) {
      imageUrls = rewriteTruckImagesStorageUrls(
        await loadImagesFromMapping(decodedTruckName, siteBaseUrl || undefined)
      )
      if (imageUrls.length > 0) {
        imageSource = 'mapping-fallback'
      }
    }

    if (imageUrls.length === 0) {
      return NextResponse.json({
        images: [],
        message: 'No image files found in Storage or mapping files',
        folder: folderName,
        availableFolders: availableFolders.slice(0, 20),
        hint: 'Upload images to the truck-images bucket or add mapping JSON. URLs in mappings are rewritten to your NEXT_PUBLIC_SUPABASE_URL.',
      })
    }

    const imagesForResponse = isEicherPro2110LTruckName(decodedTruckName)
      ? filterEicherPro2110LDocumentScreenshotsFromUrls(imageUrls)
      : imageUrls

    console.log(`[API] ✅ Successfully returning ${imagesForResponse.length} images (${imageSource})`)
    const body: Record<string, unknown> = { 
      images: imagesForResponse,
      count: imagesForResponse.length,
      folder: effectiveFolder,
      source: imageSource
    }
    if (debug) {
      body.debug = {
        folder: effectiveFolder,
        availableFoldersCount: availableFolders.length,
        firstImage: imagesForResponse[0],
      }
    }
    return NextResponse.json(body)
  } catch (error: any) {
    console.error('[API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || String(error) },
      { status: 500 }
    )
  }
}
