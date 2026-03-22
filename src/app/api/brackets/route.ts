import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { geocodeAddress, distanceKm } from '@/lib/geocode'

const NEARBY_RADIUS_KM = 50

// GET: Fetch bracket for a university + month/year (or current month)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const university = searchParams.get('university')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')

    if (!university) {
      return NextResponse.json({ error: 'university is required' }, { status: 400 })
    }

    const now = new Date()
    const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()))

    let bracket = await prisma.bracket.findUnique({
      where: { university_month_year: { university, month, year } },
      include: {
        matchups: {
          include: {
            locationA: { select: { id: true, name: true, imageUrl: true, avgRating: true, reviewCount: true, category: true } },
            locationB: { select: { id: true, name: true, imageUrl: true, avgRating: true, reviewCount: true, category: true } },
            winner: { select: { id: true, name: true } },
            votes: { select: { id: true, locationId: true, userId: true } },
          },
          orderBy: [{ round: 'asc' }, { position: 'asc' }],
        },
      },
    })

    // Auto-create bracket if none exists for this month
    if (!bracket) {
      // Resolve coordinates: use provided lat/lng, or geocode the university name
      let uniLat = lat ? parseFloat(lat) : NaN
      let uniLng = lng ? parseFloat(lng) : NaN

      if (isNaN(uniLat) || isNaN(uniLng)) {
        const coords = await geocodeAddress(university)
        if (coords) {
          uniLat = coords.lat
          uniLng = coords.lng
        }
      }

      bracket = await createBracket(university, month, year, uniLat, uniLng)
      if (!bracket) {
        return NextResponse.json({ error: 'Not enough locations nearby to create a bracket (need at least 2)' }, { status: 404 })
      }
    }

    return NextResponse.json(bracket)
  } catch (error) {
    console.error('Error fetching bracket:', error)
    return NextResponse.json({ error: 'Failed to fetch bracket' }, { status: 500 })
  }
}

async function createBracket(university: string, month: number, year: number, uniLat: number, uniLng: number) {
  let locations

  if (!isNaN(uniLat) && !isNaN(uniLng)) {
    // Find locations nearby using bounding box, then filter by Haversine distance
    const latDelta = NEARBY_RADIUS_KM / 111 // ~1 degree latitude = 111km
    const lngDelta = NEARBY_RADIUS_KM / (111 * Math.cos(uniLat * Math.PI / 180))

    const candidates = await prisma.location.findMany({
      where: {
        latitude: { gte: uniLat - latDelta, lte: uniLat + latDelta },
        longitude: { gte: uniLng - lngDelta, lte: uniLng + lngDelta },
      },
      orderBy: [{ avgRating: 'desc' }, { reviewCount: 'desc' }],
    })

    // Filter by actual distance and sort by rating
    locations = candidates
      .filter(l => l.latitude && l.longitude && distanceKm(uniLat, uniLng, l.latitude!, l.longitude!) <= NEARBY_RADIUS_KM)
      .slice(0, 16)

    // If geo search found nothing, also try university name match
    if (locations.length < 2) {
      const byName = await prisma.location.findMany({
        where: {
          OR: [
            { university },
            { university: { contains: university, mode: 'insensitive' as const } },
          ],
        },
        orderBy: [{ avgRating: 'desc' }, { reviewCount: 'desc' }],
        take: 16,
      })
      // Merge, avoiding duplicates
      const existingIds = new Set(locations.map(l => l.id))
      for (const loc of byName) {
        if (!existingIds.has(loc.id)) {
          locations.push(loc)
          if (locations.length >= 16) break
        }
      }
    }
  } else {
    // Fallback: case-insensitive university name match
    const exactCount = await prisma.location.count({ where: { university } })
    if (exactCount > 0) {
      locations = await prisma.location.findMany({
        where: { university },
        orderBy: [{ avgRating: 'desc' }, { reviewCount: 'desc' }],
        take: 16,
      })
    } else {
      locations = await prisma.location.findMany({
        where: {
          OR: [
            { university: { contains: university, mode: 'insensitive' as const } },
            { university: { startsWith: university.split(',')[0].trim(), mode: 'insensitive' as const } },
          ],
        },
        orderBy: [{ avgRating: 'desc' }, { reviewCount: 'desc' }],
        take: 16,
      })
    }
  }

  if (locations.length < 2) return null

  // Pad to nearest power of 2 (2, 4, 8, or 16)
  let bracketSize = 2
  if (locations.length > 2) bracketSize = 4
  if (locations.length > 4) bracketSize = 8
  if (locations.length > 8) bracketSize = 16

  const seeded = locations.slice(0, bracketSize)

  const seedOrder = bracketSize === 16
    ? [0, 15, 7, 8, 4, 11, 3, 12, 5, 10, 2, 13, 6, 9, 1, 14]
    : bracketSize === 8
    ? [0, 7, 3, 4, 2, 5, 1, 6]
    : bracketSize === 4
    ? [0, 3, 1, 2]
    : [0, 1]

  const totalRounds = Math.log2(bracketSize)
  const firstRoundMatchups = bracketSize / 2

  const bracket = await prisma.bracket.create({
    data: {
      university,
      month,
      year,
      round: 1,
    },
  })

  // Create first round matchups
  for (let i = 0; i < firstRoundMatchups; i++) {
    const aIdx = seedOrder[i * 2]
    const bIdx = seedOrder[i * 2 + 1]
    await prisma.bracketMatchup.create({
      data: {
        bracketId: bracket.id,
        round: 1,
        position: i,
        locationAId: seeded[aIdx]?.id || null,
        locationBId: seeded[bIdx]?.id || null,
      },
    })
  }

  // Create empty matchups for subsequent rounds
  for (let round = 2; round <= totalRounds; round++) {
    const matchupsInRound = bracketSize / Math.pow(2, round)
    for (let i = 0; i < matchupsInRound; i++) {
      await prisma.bracketMatchup.create({
        data: {
          bracketId: bracket.id,
          round,
          position: i,
          locationAId: null,
          locationBId: null,
        },
      })
    }
  }

  // Re-fetch with relations
  return prisma.bracket.findUnique({
    where: { id: bracket.id },
    include: {
      matchups: {
        include: {
          locationA: { select: { id: true, name: true, imageUrl: true, avgRating: true, reviewCount: true, category: true } },
          locationB: { select: { id: true, name: true, imageUrl: true, avgRating: true, reviewCount: true, category: true } },
          winner: { select: { id: true, name: true } },
          votes: { select: { id: true, locationId: true, userId: true } },
        },
        orderBy: [{ round: 'asc' }, { position: 'asc' }],
      },
    },
  })
}
