import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

// POST: Advance the bracket to the next round (determines winners by vote count)
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const bracket = await prisma.bracket.findUnique({
      where: { id: params.id },
      include: {
        matchups: {
          include: {
            votes: true,
          },
          orderBy: [{ round: 'asc' }, { position: 'asc' }],
        },
      },
    })

    if (!bracket) {
      return NextResponse.json({ error: 'Bracket not found' }, { status: 404 })
    }

    if (bracket.finished) {
      return NextResponse.json({ error: 'Bracket is already finished' }, { status: 400 })
    }

    const currentRound = bracket.round
    const currentMatchups = bracket.matchups.filter((m) => m.round === currentRound)
    const nextRoundMatchups = bracket.matchups.filter((m) => m.round === currentRound + 1)

    // Determine winners for each matchup in the current round
    for (const matchup of currentMatchups) {
      if (matchup.winnerId) continue // already decided
      if (!matchup.locationAId && !matchup.locationBId) continue

      // If only one location, they auto-advance
      if (!matchup.locationAId) {
        await prisma.bracketMatchup.update({
          where: { id: matchup.id },
          data: { winnerId: matchup.locationBId },
        })
        continue
      }
      if (!matchup.locationBId) {
        await prisma.bracketMatchup.update({
          where: { id: matchup.id },
          data: { winnerId: matchup.locationAId },
        })
        continue
      }

      // Count votes
      const votesA = matchup.votes.filter((v) => v.locationId === matchup.locationAId).length
      const votesB = matchup.votes.filter((v) => v.locationId === matchup.locationBId).length

      // Winner is whoever has more votes; tie goes to higher-seeded (locationA)
      const winnerId = votesB > votesA ? matchup.locationBId : matchup.locationAId

      await prisma.bracketMatchup.update({
        where: { id: matchup.id },
        data: { winnerId },
      })
    }

    // Populate next round matchups with winners
    if (nextRoundMatchups.length > 0) {
      // Re-fetch current matchups with winners set
      const updatedCurrentMatchups = await prisma.bracketMatchup.findMany({
        where: { bracketId: bracket.id, round: currentRound },
        orderBy: { position: 'asc' },
      })

      for (let i = 0; i < nextRoundMatchups.length; i++) {
        const matchA = updatedCurrentMatchups[i * 2]
        const matchB = updatedCurrentMatchups[i * 2 + 1]

        await prisma.bracketMatchup.update({
          where: { id: nextRoundMatchups[i].id },
          data: {
            locationAId: matchA?.winnerId || null,
            locationBId: matchB?.winnerId || null,
          },
        })
      }

      // Advance to next round
      await prisma.bracket.update({
        where: { id: bracket.id },
        data: { round: currentRound + 1 },
      })
    } else {
      // No more rounds — bracket is finished
      await prisma.bracket.update({
        where: { id: bracket.id },
        data: { finished: true },
      })
    }

    // Return updated bracket
    const updated = await prisma.bracket.findUnique({
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

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error advancing bracket:', error)
    return NextResponse.json({ error: 'Failed to advance bracket' }, { status: 500 })
  }
}
