import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { geocodeAddress } from '@/lib/geocode'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const university = searchParams.get('university')

    // Use flexible matching: exact first, then case-insensitive contains
    let where = {}
    if (university) {
      // First try exact match
      const exactCount = await prisma.location.count({ where: { university } })
      if (exactCount > 0) {
        where = { university }
      } else {
        // Fall back to case-insensitive contains matching
        // This handles cases like "Vanderbilt" vs "Vanderbilt University"
        where = {
          OR: [
            { university: { contains: university, mode: 'insensitive' as const } },
            { university: { startsWith: university.split(',')[0].trim(), mode: 'insensitive' as const } },
          ],
        }
      }
    }

    const locations = await prisma.location.findMany({
      where,
      orderBy: { reviewCount: 'desc' },
    })

    const parsed = locations.map((loc) => {
      let categories: string[]
      try {
        categories = JSON.parse(loc.category)
      } catch {
        categories = [loc.category]
      }
      return {
        ...loc,
        category: loc.category,
        categories,
        vibes: JSON.parse(loc.vibes) as string[],
      }
    })

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}



export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be signed in to create a post' },
        { status: 401 }
      )
    }

    if (!session.user.email.endsWith('.edu')) {
      return NextResponse.json(
        { error: 'Only .edu email addresses can create posts' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      address,
      university,
      category,
      description,
      vibes,
      priceLevel,
      waitMinutes,
      imageUrl,
      rating,
      reviewBody,
    } = body

    // Validate required location fields
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Location name must be at least 2 characters' },
        { status: 400 }
      )
    }

    if (!address || typeof address !== 'string' || address.trim().length < 5) {
      return NextResponse.json(
        { error: 'Address must be at least 5 characters' },
        { status: 400 }
      )
    }

    const validCategories = ['OUTDOORS', 'ATTRACTION', 'RESTAURANT', 'STUDY_SPOT', 'CAFE', 'NIGHTLIFE', 'ON_CAMPUS', 'CAMPUS_SPOT']
    const categoryArray = Array.isArray(category) ? category : (typeof category === 'string' ? [category] : [])
    const filteredCategories = categoryArray.filter((c: string) => validCategories.includes(c))
    if (filteredCategories.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one valid category' },
        { status: 400 }
      )
    }

    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return NextResponse.json(
        { error: 'Description must be at least 10 characters' },
        { status: 400 }
      )
    }

    const validPriceLevels = ['FREE', 'DOLLAR', 'TWO_DOLLAR', 'THREE_DOLLAR']
    if (!priceLevel || !validPriceLevels.includes(priceLevel)) {
      return NextResponse.json(
        { error: 'Invalid price level' },
        { status: 400 }
      )
    }

    if (typeof rating !== 'number' || rating < 0.5 || rating > 5 || (rating * 2) % 1 !== 0) {
      return NextResponse.json(
        { error: 'Rating must be between 0.5 and 5 in 0.5 increments' },
        { status: 400 }
      )
    }

    if (!reviewBody || typeof reviewBody !== 'string' || reviewBody.trim().length < 10) {
      return NextResponse.json(
        { error: 'Review must be at least 10 characters' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const parsedVibes = Array.isArray(vibes) ? vibes : []
    const parsedWait = typeof waitMinutes === 'number' && waitMinutes >= 0 ? waitMinutes : 0

    // Default image based on category if none provided
    const defaultImages: Record<string, string> = {
      CAMPUS_SPOT: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800',
      RESTAURANT: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
      ATTRACTION: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800',
    }
    const finalImageUrl = imageUrl && typeof imageUrl === 'string' && imageUrl.trim().length > 0
      ? imageUrl.trim()
      : defaultImages[filteredCategories[0]] || 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800'

    // Geocode the address
    const coords = await geocodeAddress(address.trim())

    // Create location and initial review in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const location = await tx.location.create({
        data: {
          name: name.trim(),
          description: description.trim(),
          category: JSON.stringify(filteredCategories),
          address: address.trim(),
          university: typeof university === 'string' ? university.trim() : '',
          latitude: coords?.lat ?? null,
          longitude: coords?.lng ?? null,
          imageUrl: finalImageUrl,
          vibes: JSON.stringify(parsedVibes),
          priceLevel,
          avgWaitMinutes: parsedWait,
          avgRating: rating,
          reviewCount: 1,
          createdBy: user.id,
        },
      })

      const review = await tx.review.create({
        data: {
          rating,
          body: reviewBody.trim(),
          waitMinutes: parsedWait,
          vibes: JSON.stringify(parsedVibes),
          userId: user.id,
          locationId: location.id,
        },
      })

      return { location, review }
    })

    return NextResponse.json({
      ...result.location,
      vibes: parsedVibes,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating location:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
