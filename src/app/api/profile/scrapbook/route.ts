import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get locations the user created
    const createdLocations = await prisma.location.findMany({
      where: { createdBy: user.id },
      select: {
        id: true,
        name: true,
        category: true,
        imageUrl: true,
        avgRating: true,
        reviewCount: true,
        university: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get locations the user reviewed (but didn't create)
    const reviews = await prisma.review.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        rating: true,
        body: true,
        createdAt: true,
        location: {
          select: {
            id: true,
            name: true,
            category: true,
            imageUrl: true,
            avgRating: true,
            reviewCount: true,
            university: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Build scrapbook entries
    const createdEntries = createdLocations.map(loc => ({
      type: 'post' as const,
      locationId: loc.id,
      locationName: loc.name,
      category: loc.category,
      imageUrl: loc.imageUrl,
      avgRating: loc.avgRating,
      reviewCount: loc.reviewCount,
      university: loc.university,
      date: loc.createdAt,
    }))

    const reviewEntries = reviews.map(rev => ({
      type: 'review' as const,
      locationId: rev.location.id,
      locationName: rev.location.name,
      category: rev.location.category,
      imageUrl: rev.location.imageUrl,
      avgRating: rev.location.avgRating,
      reviewCount: rev.location.reviewCount,
      university: rev.location.university,
      userRating: rev.rating,
      reviewSnippet: rev.body.slice(0, 120),
      date: rev.createdAt,
    }))

    // Combine and sort by date descending
    const scrapbook = [...createdEntries, ...reviewEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    return NextResponse.json(scrapbook)
  } catch (error) {
    console.error('Error fetching scrapbook:', error)
    return NextResponse.json({ error: 'Failed to fetch scrapbook' }, { status: 500 })
  }
}
