import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org'

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `${NOMINATIM_URL}/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'PutYourAnchorDown/1.0' } }
    )
    const data = await res.json()
    if (data.length === 0) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

// Hardcoded university coordinates as fallback
const UNIVERSITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'University of Virginia': { lat: 38.0336, lng: -78.5080 },
  'Duke University': { lat: 36.0014, lng: -78.9382 },
  'University of North Carolina': { lat: 35.9049, lng: -79.0469 },
}

async function main() {
  const locations = await prisma.location.findMany({
    where: { latitude: null },
  })

  console.log(`Found ${locations.length} locations without coordinates`)

  for (const loc of locations) {
    // Try geocoding with university name appended
    let coords = await geocode(`${loc.name}, ${loc.university}`)
    await new Promise(r => setTimeout(r, 1100))

    if (!coords) {
      coords = await geocode(`${loc.address}, ${loc.university}`)
      await new Promise(r => setTimeout(r, 1100))
    }

    // Fall back to university coordinates
    if (!coords && loc.university && UNIVERSITY_COORDS[loc.university]) {
      coords = UNIVERSITY_COORDS[loc.university]
      // Add small random offset so locations don't stack
      coords = {
        lat: coords.lat + (Math.random() - 0.5) * 0.01,
        lng: coords.lng + (Math.random() - 0.5) * 0.01,
      }
    }

    if (coords) {
      await prisma.location.update({
        where: { id: loc.id },
        data: { latitude: coords.lat, longitude: coords.lng },
      })
      console.log(`  Geocoded: ${loc.name} -> (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`)
    } else {
      console.log(`  Still failed: ${loc.name}`)
    }
  }

  console.log('Done!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
