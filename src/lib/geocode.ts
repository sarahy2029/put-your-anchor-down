const NOMINATIM_URL = 'https://nominatim.openstreetmap.org'

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
  type: string
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `${NOMINATIM_URL}/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'PutYourAnchorDown/1.0' } }
    )
    const data: NominatimResult[] = await res.json()
    if (data.length === 0) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

// Multi-campus university system prefixes — when the first comma segment
// matches one of these, include the second segment (campus/city) in the name.
const MULTI_CAMPUS_PREFIXES = [
  'University of California',
  'California State University',
  'State University of New York',
  'University of Texas',
  'University of Illinois',
  'University of Colorado',
  'University of Wisconsin',
  'University of Michigan',
  'University of Minnesota',
  'University of Missouri',
  'University of Nebraska',
  'Indiana University',
  'University of Alabama',
  'University of Alaska',
  'University of Hawaii',
  'University of Louisiana',
  'University of Massachusetts',
  'University of North Carolina',
  'Rutgers University',
  'University of South Carolina',
]

// Hardcoded campuses for multi-campus systems that Nominatim doesn't split
const MULTI_CAMPUS_EXPANSIONS: Record<string, Array<{ name: string; lat: number; lng: number }>> = {
  'university of california': [
    { name: 'University of California, Berkeley', lat: 37.8719, lng: -122.2585 },
    { name: 'University of California, Los Angeles (UCLA)', lat: 34.0689, lng: -118.4452 },
    { name: 'University of California, San Diego (UCSD)', lat: 32.8801, lng: -117.234 },
    { name: 'University of California, Davis', lat: 38.5382, lng: -121.7617 },
    { name: 'University of California, Irvine', lat: 33.6405, lng: -117.8443 },
    { name: 'University of California, Santa Barbara', lat: 34.4133, lng: -119.8610 },
    { name: 'University of California, Santa Cruz', lat: 36.9914, lng: -122.0609 },
    { name: 'University of California, Riverside', lat: 33.9737, lng: -117.3281 },
    { name: 'University of California, Merced', lat: 37.3660, lng: -120.4248 },
    { name: 'University of California, San Francisco (UCSF)', lat: 37.7631, lng: -122.4586 },
  ],
  'california state university': [
    { name: 'California State University, Long Beach', lat: 33.7838, lng: -118.1141 },
    { name: 'California State University, Fullerton', lat: 33.8829, lng: -117.8854 },
    { name: 'California State University, Northridge', lat: 34.2399, lng: -118.5283 },
    { name: 'California State University, Los Angeles', lat: 34.0664, lng: -118.1685 },
    { name: 'California State University, Sacramento', lat: 38.5607, lng: -121.4235 },
    { name: 'San Diego State University', lat: 32.7757, lng: -117.0719 },
    { name: 'San Jose State University', lat: 37.3352, lng: -121.8811 },
    { name: 'San Francisco State University', lat: 37.7219, lng: -122.4782 },
    { name: 'Cal Poly San Luis Obispo', lat: 35.3050, lng: -120.6625 },
    { name: 'Cal Poly Pomona', lat: 34.0565, lng: -117.8215 },
  ],
  'state university of new york': [
    { name: 'SUNY Buffalo', lat: 43.0008, lng: -78.7890 },
    { name: 'SUNY Stony Brook', lat: 40.9126, lng: -73.1234 },
    { name: 'SUNY Albany', lat: 42.6866, lng: -73.8237 },
    { name: 'SUNY Binghamton', lat: 42.0894, lng: -75.9694 },
    { name: 'SUNY New Paltz', lat: 41.7442, lng: -74.0834 },
    { name: 'SUNY Oswego', lat: 43.4523, lng: -76.5447 },
    { name: 'SUNY Geneseo', lat: 42.7959, lng: -77.8197 },
    { name: 'SUNY Cortland', lat: 42.5966, lng: -76.1813 },
  ],
  'university of texas': [
    { name: 'University of Texas at Austin', lat: 30.2849, lng: -97.7341 },
    { name: 'University of Texas at Dallas', lat: 32.9886, lng: -96.7479 },
    { name: 'University of Texas at San Antonio', lat: 29.5827, lng: -98.6198 },
    { name: 'University of Texas at Arlington', lat: 32.7299, lng: -97.1139 },
    { name: 'University of Texas at El Paso', lat: 31.7697, lng: -106.5042 },
    { name: 'University of Texas Rio Grande Valley', lat: 26.3053, lng: -98.1742 },
  ],
}

function extractUniversityName(displayName: string): string {
  const parts = displayName.split(',').map(p => p.trim())
  const first = parts[0]

  // Check if it's a multi-campus system that needs the campus/city appended
  if (parts.length >= 2) {
    const isMultiCampus = MULTI_CAMPUS_PREFIXES.some(
      prefix => first.toLowerCase() === prefix.toLowerCase()
    )
    if (isMultiCampus) {
      // Second segment is the campus name (e.g., "Berkeley", "San Diego")
      // Skip if it looks like a street number/address
      const second = parts[1]
      if (second && !/^\d/.test(second)) {
        return `${first}, ${second}`
      }
    }
  }

  return first
}

export async function searchUniversities(query: string): Promise<Array<{ name: string; lat: number; lng: number }>> {
  if (!query || query.length < 2) return []
  try {
    // Check if query matches a multi-campus system prefix
    const queryLower = query.toLowerCase().trim()
    for (const [prefix, campuses] of Object.entries(MULTI_CAMPUS_EXPANSIONS)) {
      if (prefix.includes(queryLower) || queryLower.includes(prefix)) {
        // Return the individual campuses filtered by the query
        const filtered = campuses.filter(c =>
          c.name.toLowerCase().includes(queryLower)
        )
        // If the query is just the system name, return all campuses
        return filtered.length > 0 ? filtered : campuses
      }
    }

    const res = await fetch(
      `${NOMINATIM_URL}/search?q=${encodeURIComponent(query + ' university')}&format=json&limit=8&type=university`,
      { headers: { 'User-Agent': 'PutYourAnchorDown/1.0' } }
    )
    const data: NominatimResult[] = await res.json()
    // Deduplicate by name
    const seen = new Set<string>()
    return data
      .map(r => ({
        name: extractUniversityName(r.display_name),
        fullName: r.display_name,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
      }))
      .filter(r => {
        const key = r.name.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
  } catch {
    return []
  }
}

// Haversine distance in km
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
