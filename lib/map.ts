import { isBrowser, readLS, writeLS } from "@/lib/storage"
import type { LocationRow } from "./types"

const parseLocations = (raw: string | null): LocationRow[] => {
  if (!raw) return []
  try {
    return JSON.parse(raw) ?? []
  } catch {
    return []
  }
}

export async function listLocations({
  q,
  city,
  publicOnly,
}: {
  q?: string
  city?: string
  publicOnly?: boolean
}): Promise<LocationRow[]> {
  if (!isBrowser()) return []
  let locations: LocationRow[] = parseLocations(readLS("treadmill_locations"))

  locations = locations.filter((loc) => loc.status === "approved")

  if (publicOnly) {
    locations = locations.filter((loc) => loc.allow_public)
  }

  if (city) {
    locations = locations.filter((loc) => loc.city?.toLowerCase().includes(city.toLowerCase()))
  }

  if (q) {
    locations = locations.filter(
      (loc) => loc.name.toLowerCase().includes(q.toLowerCase()) || loc.address?.toLowerCase().includes(q.toLowerCase()),
    )
  }

  return locations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function submitLocation(payload: Partial<LocationRow>): Promise<string> {
  if (!isBrowser()) throw new Error("Not available on the server")

  const savedUser = readLS("auth_user")
  if (!savedUser) throw new Error("Not authenticated")

  const user = JSON.parse(savedUser)
  const locations: LocationRow[] = parseLocations(readLS("treadmill_locations"))

  const newLocation: LocationRow = {
    id: String(Date.now()),
    name: payload.name || "",
    city: payload.city,
    address: payload.address,
    treadmill_type: payload.treadmill_type,
    photo_urls: payload.photo_urls,
    allow_public: payload.allow_public || false,
    contact: payload.contact,
    status: "pending",
    created_by: user.id,
    created_at: new Date().toISOString(),
    lat: payload.lat,
    lng: payload.lng,
  }

  locations.push(newLocation)
  writeLS("treadmill_locations", JSON.stringify(locations))

  return newLocation.id
}

export async function myLocations(): Promise<LocationRow[]> {
  if (!isBrowser()) return []

  const savedUser = readLS("auth_user")
  if (!savedUser) return []

  const user = JSON.parse(savedUser)
  const locations: LocationRow[] = parseLocations(readLS("treadmill_locations"))

  return locations
    .filter((loc) => loc.created_by === user.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function approveLocation(id: string): Promise<void> {
  if (!isBrowser()) return

  const locations: LocationRow[] = parseLocations(readLS("treadmill_locations"))
  const location = locations.find((loc) => loc.id === id)
  if (location) {
    location.status = "approved"
    writeLS("treadmill_locations", JSON.stringify(locations))

    if (location.allow_public) {
      const savedUser = readLS("auth_user")
      if (savedUser) {
        const user = JSON.parse(savedUser)
        user.credits_extra = (user.credits_extra || 0) + 5
        writeLS("auth_user", JSON.stringify(user))
      }
    }
  }
}

export async function rejectLocation(id: string): Promise<void> {
  if (!isBrowser()) return

  const locations: LocationRow[] = parseLocations(readLS("treadmill_locations"))
  const location = locations.find((loc) => loc.id === id)
  if (location) {
    location.status = "rejected"
    writeLS("treadmill_locations", JSON.stringify(locations))
  }
}
