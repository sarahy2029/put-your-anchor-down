import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { searchUniversities } from '@/lib/geocode'

export async function GET(request: NextRequest) {
  try {
    const query = new URL(request.url).searchParams.get('q') || ''
    if (query.length < 2) {
      return NextResponse.json([])
    }

    // Search local DB first for universities that match
    const localLocations = await prisma.location.findMany({
      where: {
        university: { contains: query },
      },
      select: { university: true, latitude: true, longitude: true },
      distinct: ['university'],
    })

    const localResults = localLocations
      .filter(l => l.university && l.latitude && l.longitude)
      .map(l => ({
        name: l.university,
        lat: l.latitude!,
        lng: l.longitude!,
        source: 'local' as const,
      }))

    // Also search Nominatim for global universities
    const externalResults = await searchUniversities(query)
    const externalMapped = externalResults.map(r => ({
      ...r,
      source: 'external' as const,
    }))

    // Merge: local first, then external (deduplicated)
    const seen = new Set(localResults.map(r => r.name.toLowerCase()))
    const merged = [
      ...localResults,
      ...externalMapped.filter(r => !seen.has(r.name.toLowerCase())),
    ]

    return NextResponse.json(merged.slice(0, 10))
  } catch (error) {
    console.error('Error searching universities:', error)
    return NextResponse.json([], { status: 200 })
  }
}
