import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be signed in to get recommendations' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, university: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get the user's reviews with location data
    const userReviews = await prisma.review.findMany({
      where: { userId: user.id },
      include: {
        location: {
          select: {
            id: true,
            category: true,
            vibes: true,
            priceLevel: true,
            university: true,
          },
        },
      },
    })

    // Get locations the user has created
    const userLocations = await prisma.location.findMany({
      where: { createdBy: user.id },
      select: { id: true, category: true, vibes: true, priceLevel: true },
    })

    // Analyze user preferences
    const reviewedLocationIds = userReviews.map((r) => r.location.id)
    const createdLocationIds = userLocations.map((l) => l.id)
    const seenLocationIds = new Set(reviewedLocationIds.concat(createdLocationIds))

    // Count category preferences (weighted by rating)
    const categoryScores: Record<string, number> = {}
    const vibeScores: Record<string, number> = {}
    const pricePreferences: Record<string, number> = {}

    for (const review of userReviews) {
      const weight = review.rating / 5 // normalize to 0-1

      // Parse categories
      let cats: string[] = []
      try {
        cats = JSON.parse(review.location.category)
      } catch {
        cats = [review.location.category]
      }
      for (const cat of cats) {
        categoryScores[cat] = (categoryScores[cat] || 0) + weight
      }

      // Parse vibes
      let vibes: string[] = []
      try {
        vibes = JSON.parse(review.location.vibes)
      } catch {
        vibes = []
      }
      for (const vibe of vibes) {
        vibeScores[vibe] = (vibeScores[vibe] || 0) + weight
      }

      // Price preferences
      const price = review.location.priceLevel
      pricePreferences[price] = (pricePreferences[price] || 0) + weight
    }

    // Also factor in created locations (slightly lower weight)
    for (const loc of userLocations) {
      let cats: string[] = []
      try {
        cats = JSON.parse(loc.category)
      } catch {
        cats = [loc.category]
      }
      for (const cat of cats) {
        categoryScores[cat] = (categoryScores[cat] || 0) + 0.5
      }

      let vibes: string[] = []
      try {
        vibes = JSON.parse(loc.vibes)
      } catch {
        vibes = []
      }
      for (const vibe of vibes) {
        vibeScores[vibe] = (vibeScores[vibe] || 0) + 0.5
      }

      pricePreferences[loc.priceLevel] = (pricePreferences[loc.priceLevel] || 0) + 0.5
    }

    // Get all locations the user hasn't interacted with
    const allLocations = await prisma.location.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        imageUrl: true,
        category: true,
        vibes: true,
        priceLevel: true,
        avgRating: true,
        reviewCount: true,
        avgWaitMinutes: true,
        university: true,
      },
    })

    const candidates = allLocations.filter((loc) => !seenLocationIds.has(loc.id))

    // Score each candidate
    const scored = candidates.map((loc) => {
      let score = 0
      const reasons: string[] = []

      // Category match
      let cats: string[] = []
      try {
        cats = JSON.parse(loc.category)
      } catch {
        cats = [loc.category]
      }
      for (const cat of cats) {
        if (categoryScores[cat]) {
          score += categoryScores[cat] * 3
          reasons.push(`Matches your love for ${formatCategory(cat)} spots`)
        }
      }

      // Vibe match
      let vibes: string[] = []
      try {
        vibes = JSON.parse(loc.vibes)
      } catch {
        vibes = []
      }
      let vibeMatches = 0
      for (const vibe of vibes) {
        if (vibeScores[vibe]) {
          score += vibeScores[vibe] * 2
          vibeMatches++
        }
      }
      if (vibeMatches > 0) {
        const matchedVibes = vibes.filter((v) => vibeScores[v])
        reasons.push(`${matchedVibes.slice(0, 2).join(' & ')} vibes you enjoy`)
      }

      // Price match
      if (pricePreferences[loc.priceLevel]) {
        score += pricePreferences[loc.priceLevel]
        reasons.push(`Fits your ${formatPrice(loc.priceLevel)} budget`)
      }

      // Boost highly rated places
      if (loc.avgRating >= 4) {
        score += loc.avgRating * 0.5
        reasons.push(`Highly rated (${loc.avgRating.toFixed(1)} stars)`)
      }

      // Boost places with more reviews (social proof)
      if (loc.reviewCount >= 3) {
        score += Math.log(loc.reviewCount) * 0.5
        reasons.push(`Popular with ${loc.reviewCount} reviews`)
      }

      // Boost same university
      if (user.university && loc.university && loc.university.toLowerCase().includes(user.university.toLowerCase())) {
        score += 2
        reasons.push('Near your university')
      }

      return {
        ...loc,
        vibes,
        score,
        reasons: reasons.slice(0, 3),
      }
    })

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score)

    // Group into recommendation categories
    const hasActivity = userReviews.length > 0 || userLocations.length > 0

    if (!hasActivity) {
      // No activity — return popular & top-rated locations
      const popular = allLocations
        .filter((l) => l.reviewCount > 0)
        .sort((a, b) => b.reviewCount - a.reviewCount || b.avgRating - a.avgRating)
        .slice(0, 12)
        .map((loc) => {
          let vibes: string[] = []
          try { vibes = JSON.parse(loc.vibes) } catch { vibes = [] }
          return {
            ...loc,
            vibes,
            score: 0,
            reasons: [
              loc.avgRating >= 4 ? `Rated ${loc.avgRating.toFixed(1)} stars` : '',
              loc.reviewCount > 0 ? `${loc.reviewCount} reviews` : '',
            ].filter(Boolean),
          }
        })

      return NextResponse.json({
        hasActivity: false,
        sections: [
          {
            title: 'Trending Near You',
            subtitle: 'Start reviewing places to get personalized recommendations!',
            icon: 'trending',
            locations: popular,
          },
        ],
      })
    }

    // Build personalized sections
    const sections: Array<{
      title: string
      subtitle: string
      icon: string
      locations: typeof scored
    }> = []

    // Top picks
    const topPicks = scored.slice(0, 6)
    if (topPicks.length > 0) {
      sections.push({
        title: 'Your Top Picks',
        subtitle: 'Handpicked based on everything you love',
        icon: 'sparkles',
        locations: topPicks,
      })
    }

    // Find category-specific recommendations
    const topCategories = Object.entries(categoryScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat)

    for (const cat of topCategories) {
      const catLocations = scored
        .filter((loc) => {
          let cats: string[] = []
          try { cats = JSON.parse(loc.category) } catch { cats = [loc.category] }
          return cats.includes(cat)
        })
        .slice(0, 4)

      if (catLocations.length > 0 && !sections.some((s) => s.locations.some((l) => catLocations.every((cl) => cl.id === l.id)))) {
        sections.push({
          title: `More ${formatCategory(cat)} Spots`,
          subtitle: `Because you enjoy ${formatCategory(cat).toLowerCase()} places`,
          icon: getCategoryIcon(cat),
          locations: catLocations,
        })
      }
    }

    // Hidden gems — high-rated but fewer reviews
    const hiddenGems = scored
      .filter((loc) => loc.avgRating >= 4 && loc.reviewCount <= 3 && loc.reviewCount > 0)
      .slice(0, 4)

    if (hiddenGems.length > 0) {
      sections.push({
        title: 'Hidden Gems',
        subtitle: 'Great places that deserve more attention',
        icon: 'gem',
        locations: hiddenGems,
      })
    }

    // Budget-friendly picks
    const budgetPicks = scored
      .filter((loc) => loc.priceLevel === 'FREE' || loc.priceLevel === 'DOLLAR')
      .slice(0, 4)

    if (budgetPicks.length > 0) {
      sections.push({
        title: 'Budget-Friendly Finds',
        subtitle: 'Great experiences that won\'t break the bank',
        icon: 'wallet',
        locations: budgetPicks,
      })
    }

    return NextResponse.json({
      hasActivity: true,
      userStats: {
        reviewCount: userReviews.length,
        postCount: userLocations.length,
        topCategories: topCategories.map(formatCategory),
        topVibes: Object.entries(vibeScores)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([vibe]) => vibe),
      },
      sections,
    })
  } catch (error) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}

function formatCategory(cat: string): string {
  const map: Record<string, string> = {
    OUTDOORS: 'Outdoors',
    ATTRACTION: 'Attraction',
    RESTAURANT: 'Restaurant',
    STUDY_SPOT: 'Study Spot',
    CAFE: 'Cafe',
    NIGHTLIFE: 'Nightlife',
    ON_CAMPUS: 'On Campus',
    CAMPUS_SPOT: 'Campus',
  }
  return map[cat] || cat
}

function formatPrice(price: string): string {
  const map: Record<string, string> = {
    FREE: 'free',
    DOLLAR: 'budget-friendly',
    TWO_DOLLAR: 'moderate',
    THREE_DOLLAR: 'upscale',
  }
  return map[price] || price
}

function getCategoryIcon(cat: string): string {
  const map: Record<string, string> = {
    OUTDOORS: 'nature',
    ATTRACTION: 'attraction',
    RESTAURANT: 'food',
    STUDY_SPOT: 'study',
    CAFE: 'cafe',
    NIGHTLIFE: 'nightlife',
    ON_CAMPUS: 'campus',
    CAMPUS_SPOT: 'campus',
  }
  return map[cat] || 'default'
}
