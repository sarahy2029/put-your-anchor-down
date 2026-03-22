import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'You must be signed in to vote' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { matchupId, locationId } = await request.json()

    if (!matchupId || !locationId) {
      return NextResponse.json({ error: 'matchupId and locationId are required' }, { status: 400 })
    }

    // Verify matchup belongs to this bracket and is in the active round
    const matchup = await prisma.bracketMatchup.findUnique({
      where: { id: matchupId },
      include: { bracket: true },
    })

    if (!matchup || matchup.bracket.id !== params.id) {
      return NextResponse.json({ error: 'Matchup not found in this bracket' }, { status: 404 })
    }

    if (matchup.round !== matchup.bracket.round) {
      return NextResponse.json({ error: 'This round is not currently active' }, { status: 400 })
    }

    if (matchup.winnerId) {
      return NextResponse.json({ error: 'This matchup has already been decided' }, { status: 400 })
    }

    // Verify the voted location is one of the two in this matchup
    if (locationId !== matchup.locationAId && locationId !== matchup.locationBId) {
      return NextResponse.json({ error: 'Invalid location for this matchup' }, { status: 400 })
    }

    // Check if user already voted on this matchup
    const existingVote = await prisma.bracketVote.findUnique({
      where: { matchupId_userId: { matchupId, userId: user.id } },
    })

    if (existingVote) {
      // Update their vote instead
      const updated = await prisma.bracketVote.update({
        where: { id: existingVote.id },
        data: { locationId },
      })
      return NextResponse.json(updated)
    }

    const vote = await prisma.bracketVote.create({
      data: {
        matchupId,
        userId: user.id,
        locationId,
      },
    })

    return NextResponse.json(vote, { status: 201 })
  } catch (error) {
    console.error('Error voting:', error)
    return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 })
  }
}
