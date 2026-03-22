import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org'

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `${NOMINATIM_URL}/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'PutYourAnchorDown/1.0' } }
    )
    const data = await res.json()
    if (data.length === 0) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

async function main() {
  const locations = await prisma.location.findMany({
    where: { latitude: null },
  })

  console.log(`Found ${locations.length} locations without coordinates`)

  for (const loc of locations) {
    const coords = await geocode(loc.address)
    if (coords) {
      await prisma.location.update({
        where: { id: loc.id },
        data: { latitude: coords.lat, longitude: coords.lng },
      })
      console.log(`  Geocoded: ${loc.name} -> (${coords.lat}, ${coords.lng})`)
    } else {
      console.log(`  Failed to geocode: ${loc.name} (${loc.address})`)
    }
    // Respect Nominatim rate limit (1 req/sec)
    await new Promise(r => setTimeout(r, 1100))
  }

  console.log('Done!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
