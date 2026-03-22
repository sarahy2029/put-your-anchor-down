import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const location = await prisma.location.findUnique({
      where: { id: params.id },
    })

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    if (location.createdBy !== user.id) {
      return NextResponse.json({ error: 'You can only edit your own posts' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, address, category, vibes, priceLevel, imageUrl, university } = body

    const updateData: Record<string, unknown> = {}

    if (name && typeof name === 'string' && name.trim().length >= 2) {
      updateData.name = name.trim()
    }
    if (description && typeof description === 'string' && description.trim().length >= 10) {
      updateData.description = description.trim()
    }
    if (address && typeof address === 'string' && address.trim().length >= 5) {
      updateData.address = address.trim()
    }
    if (university && typeof university === 'string') {
      updateData.university = university.trim()
    }
    if (imageUrl && typeof imageUrl === 'string') {
      updateData.imageUrl = imageUrl.trim()
    }

    const validCategories = ['OUTDOORS', 'ATTRACTION', 'RESTAURANT', 'STUDY_SPOT', 'CAFE', 'NIGHTLIFE', 'ON_CAMPUS', 'CAMPUS_SPOT']
    if (category) {
      const categoryArray = Array.isArray(category) ? category : [category]
      const filtered = categoryArray.filter((c: string) => validCategories.includes(c))
      if (filtered.length > 0) {
        updateData.category = JSON.stringify(filtered)
      }
    }

    if (vibes && Array.isArray(vibes)) {
      updateData.vibes = JSON.stringify(vibes)
    }

    const validPriceLevels = ['FREE', 'DOLLAR', 'TWO_DOLLAR', 'THREE_DOLLAR']
    if (priceLevel && validPriceLevels.includes(priceLevel)) {
      updateData.priceLevel = priceLevel
    }

    const updated = await prisma.location.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating location:', error)
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const location = await prisma.location.findUnique({
      where: { id: params.id },
    })

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    if (location.createdBy !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own posts' }, { status: 403 })
    }

    // Delete reviews first, then location
    await prisma.$transaction([
      prisma.review.deleteMany({ where: { locationId: params.id } }),
      prisma.location.delete({ where: { id: params.id } }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting location:', error)
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 })
  }
}
