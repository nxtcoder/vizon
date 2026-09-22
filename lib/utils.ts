import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "City, State" for browse cards ("Gurugram, Haryana"); the state is left off when it is the city ("Delhi"). */
export function formatTruckListingLocation(truck: {
  location?: string | null
  city?: string | null
  state?: string | null
  rto?: string | null
}): string {
  const city = truck.city?.trim() || truck.location?.trim()
  const state = truck.state?.trim()
  if (city && state) return city.toLowerCase() === state.toLowerCase() ? city : `${city}, ${state}`
  return city || state || truck.rto?.trim() || 'Unknown'
}


