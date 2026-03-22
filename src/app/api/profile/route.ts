import { NextRequest, NextResponse } from 'next/server'
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
        _count: { select: { reviews: true, bracketVotes: true } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Count distinct universities and cities from locations this user created
    const createdLocations = await prisma.location.findMany({
      where: { createdBy: user.id },
      select: { university: true, address: true },
    })

    const uniqueUniversities = new Set(
      createdLocations.map(l => l.university).filter(Boolean)
    )
    // Extract city from address (assume format like "123 Main St, City, State")
    const uniqueCities = new Set(
      createdLocations
        .map(l => {
          const parts = l.address.split(',').map(p => p.trim())
          return parts.length >= 2 ? parts[parts.length - 2] : null
        })
        .filter(Boolean)
    )

    return NextResponse.json({
      ...user,
      postsCount: createdLocations.length,
      uniqueUniversities: uniqueUniversities.size,
      uniqueCities: uniqueCities.size,
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { name, bio, role, university, avatarUrl, graduationYear } = body

    const validRoles = ['STUDENT', 'FACULTY', 'STAFF', 'ALUMNI', 'OTHER']
    const data: Record<string, unknown> = {}

    if (typeof name === 'string' && name.trim().length >= 1) {
      data.name = name.trim()
    }
    if (typeof bio === 'string') {
      data.bio = bio.trim().slice(0, 500)
    }
    if (typeof role === 'string' && validRoles.includes(role)) {
      data.role = role
    }
    if (typeof university === 'string') {
      data.university = university.trim()
    }
    if (typeof avatarUrl === 'string') {
      data.avatarUrl = avatarUrl.trim()
    }
    if (graduationYear === null || (typeof graduationYear === 'number' && graduationYear >= 2000 && graduationYear <= 2040)) {
      data.graduationYear = graduationYear
    }

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data,
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
        _count: { select: { reviews: true, bracketVotes: true } },
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
