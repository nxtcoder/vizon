/**
 * Builds the public Storage URL base for the `truck-images` bucket using
 * NEXT_PUBLIC_SUPABASE_URL so local, preview, and production match your project.
 */
export function publicTruckImagesRoot(): string {
  const root = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/$/, '')
  if (!root) return ''
  return `${root}/storage/v1/object/public/truck-images`
}

/**
 * Rewrites any Supabase project's `.../storage/v1/object/public/truck-images/...`
 * URL to use NEXT_PUBLIC_SUPABASE_URL (same path within the bucket).
 * Use after migrating Storage or when JSON/mappings still reference an old project ref.
 */
export function rewriteTruckImagesStorageUrlToCurrentProject(url: string): string {
  const root = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/$/, '')
  if (!root || !url || typeof url !== 'string') return url
  const m = url
    .trim()
    .match(/^https?:\/\/[^/]+\/storage\/v1\/object\/public\/truck-images\/(.+)$/i)
  if (!m?.[1]) return url
  return `${root}/storage/v1/object/public/truck-images/${m[1]}`
}

export function rewriteTruckImagesStorageUrls(urls: string[]): string[] {
  return urls.map(rewriteTruckImagesStorageUrlToCurrentProject)
}

/**
 * Extracts the top-level folder (Storage prefix) from a `truck-images` public URL,
 * e.g. `.../truck-images/MH12AB1234/01-cabin.jpg` -> `MH12AB1234`.
 * Returns null for non-bucket URLs or files sitting at the bucket root.
 */
export function truckImagesFolderFromUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null
  const m = url
    .trim()
    .match(/^https?:\/\/[^/]+\/storage\/v1\/object\/public\/truck-images\/(.+)$/i)
  if (!m?.[1]) return null
  const parts = m[1].split('/').filter(Boolean)
  if (parts.length < 2) return null
  try {
    return decodeURIComponent(parts[0])
  } catch {
    return parts[0]
  }
}
