import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        role: true,
        university: true,
        avatarUrl: true,
        graduationYear: true,
        createdAt: true,
        _count: {
          select: {
            reviews: true,
            bracketVotes: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Count posts (locations created by this user)
    const postsCount = await prisma.location.count({
      where: { createdBy: user.id },
    })

    // Count unique universities and cities
    const createdLocations = await prisma.location.findMany({
      where: { createdBy: user.id },
      select: { university: true, address: true },
    })

    const uniqueUniversities = new Set(
      createdLocations.map((l) => l.university).filter(Boolean)
    ).size

    const uniqueCities = new Set(
      createdLocations
        .map((l) => {
          const parts = l.address.split(',')
          return parts.length >= 2 ? parts[parts.length - 2].trim() : ''
        })
        .filter(Boolean)
    ).size

    // Get scrapbook entries
    const userLocations = await prisma.location.findMany({
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

    const userReviews = await prisma.review.findMany({
      where: { userId: user.id },
      include: {
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

    const scrapbook = [
      ...userLocations.map((loc) => ({
        type: 'post' as const,
        locationId: loc.id,
        locationName: loc.name,
        category: loc.category,
        imageUrl: loc.imageUrl,
        avgRating: loc.avgRating,
        reviewCount: loc.reviewCount,
        university: loc.university,
        date: loc.createdAt.toISOString(),
      })),
      ...userReviews.map((rev) => ({
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
        date: rev.createdAt.toISOString(),
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Mask the email for privacy
    const [local, domain] = user.email.split('@')
    const maskedEmail =
      local.length > 2
        ? `${local[0]}${'•'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`
        : user.email

    return NextResponse.json({
      ...user,
      email: maskedEmail,
      postsCount,
      uniqueUniversities,
      uniqueCities,
      scrapbook,
    })
  } catch (error) {
    console.error('Error fetching public profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
