import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      where: { university: { not: '' } },
      select: { university: true },
      distinct: ['university'],
      orderBy: { university: 'asc' },
    })

    const universities = locations.map((l) => l.university)
    return NextResponse.json(universities)
  } catch (error) {
    console.error('Error fetching universities:', error)
    return NextResponse.json([])
  }
}
