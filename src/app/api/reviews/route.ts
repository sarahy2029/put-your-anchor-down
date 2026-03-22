import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be signed in to post a review' },
        { status: 401 }
      )
    }

    // Re-validate .edu on every review submission
    if (!session.user.email.endsWith('.edu')) {
      return NextResponse.json(
        { error: 'Only .edu email addresses can post reviews' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { locationId, rating, body: reviewBody, waitMinutes, vibes } = body

    if (!locationId || !rating || !reviewBody) {
      return NextResponse.json(
        { error: 'Missing required fields: locationId, rating, body' },
        { status: 400 }
      )
    }

    if (typeof rating !== 'number' || rating < 0.5 || rating > 5 || (rating * 2) % 1 !== 0) {
      return NextResponse.json(
        { error: 'Rating must be between 0.5 and 5 in 0.5 increments' },
        { status: 400 }
      )
    }

    if (typeof reviewBody !== 'string' || reviewBody.trim().length < 10) {
      return NextResponse.json(
        { error: 'Review body must be at least 10 characters' },
        { status: 400 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    })

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        rating,
        body: reviewBody.trim(),
        waitMinutes: typeof waitMinutes === 'number' ? waitMinutes : 0,
        vibes: JSON.stringify(Array.isArray(vibes) ? vibes : []),
        userId: user.id,
        locationId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Recalculate location stats
    const allReviews = await prisma.review.findMany({
      where: { locationId },
    })

    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0)
    const totalWait = allReviews.reduce((sum, r) => sum + r.waitMinutes, 0)
    const avgRating = totalRating / allReviews.length
    const avgWaitMinutes = totalWait / allReviews.length

    await prisma.location.update({
      where: { id: locationId },
      data: {
        avgRating,
        avgWaitMinutes,
        reviewCount: allReviews.length,
      },
    })

    return NextResponse.json({
      ...review,
      vibes: JSON.parse(review.vibes),
    })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { reviewId, rating, body: reviewBody, waitMinutes, vibes } = body

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId is required' }, { status: 400 })
    }

    if (typeof rating !== 'number' || rating < 0.5 || rating > 5 || (rating * 2) % 1 !== 0) {
      return NextResponse.json({ error: 'Rating must be between 0.5 and 5 in 0.5 increments' }, { status: 400 })
    }

    if (typeof reviewBody !== 'string' || reviewBody.trim().length < 10) {
      return NextResponse.json({ error: 'Review body must be at least 10 characters' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const review = await prisma.review.findUnique({ where: { id: reviewId } })
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    if (review.userId !== user.id) {
      return NextResponse.json({ error: 'You can only edit your own reviews' }, { status: 403 })
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating,
        body: reviewBody.trim(),
        waitMinutes: typeof waitMinutes === 'number' ? waitMinutes : 0,
        vibes: JSON.stringify(Array.isArray(vibes) ? vibes : []),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    // Recalculate location stats
    const allReviews = await prisma.review.findMany({ where: { locationId: review.locationId } })
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0)
    const totalWait = allReviews.reduce((sum, r) => sum + r.waitMinutes, 0)
    await prisma.location.update({
      where: { id: review.locationId },
      data: {
        avgRating: totalRating / allReviews.length,
        avgWaitMinutes: totalWait / allReviews.length,
        reviewCount: allReviews.length,
      },
    })

    return NextResponse.json({ ...updated, vibes: JSON.parse(updated.vibes) })
  } catch (error) {
    console.error('Error updating review:', error)
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reviewId = searchParams.get('reviewId')

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const review = await prisma.review.findUnique({ where: { id: reviewId } })
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    if (review.userId !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own reviews' }, { status: 403 })
    }

    const locationId = review.locationId
    await prisma.review.delete({ where: { id: reviewId } })

    // Recalculate location stats
    const remaining = await prisma.review.findMany({ where: { locationId } })
    if (remaining.length > 0) {
      const totalRating = remaining.reduce((sum, r) => sum + r.rating, 0)
      const totalWait = remaining.reduce((sum, r) => sum + r.waitMinutes, 0)
      await prisma.location.update({
        where: { id: locationId },
        data: {
          avgRating: totalRating / remaining.length,
          avgWaitMinutes: totalWait / remaining.length,
          reviewCount: remaining.length,
        },
      })
    } else {
      await prisma.location.update({
        where: { id: locationId },
        data: { avgRating: 0, avgWaitMinutes: 0, reviewCount: 0 },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')

    if (!locationId) {
      return NextResponse.json(
        { error: 'locationId is required' },
        { status: 400 }
      )
    }

    const reviews = await prisma.review.findMany({
      where: { locationId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const parsed = reviews.map((r) => ({
      ...r,
      vibes: JSON.parse(r.vibes) as string[],
    }))

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}
