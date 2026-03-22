import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

const ROLE_OPTIONS: Record<string, string> = {
  STUDENT: 'Student',
  FACULTY: 'Faculty',
  STAFF: 'Staff',
  ALUMNI: 'Alumni',
  OTHER: 'Other',
}

const ROLE_COLORS: Record<string, string> = {
  STUDENT: 'bg-blue-100 text-blue-800',
  FACULTY: 'bg-purple-100 text-purple-800',
  STAFF: 'bg-green-100 text-green-800',
  ALUMNI: 'bg-gold-100 text-gold-800',
  OTHER: 'bg-silver-100 text-silver-700',
}

const CATEGORY_LABELS: Record<string, string> = {
  OUTDOORS: 'Outdoors',
  ATTRACTION: 'Attractions',
  RESTAURANT: 'Restaurants',
  STUDY_SPOT: 'Study Spots',
  CAFE: 'Cafes',
  NIGHTLIFE: 'Nightlife',
  ON_CAMPUS: 'On Campus',
  CAMPUS_SPOT: 'Campus',
}

const CATEGORY_COLORS: Record<string, string> = {
  OUTDOORS: 'bg-green-100 text-green-800',
  ATTRACTION: 'bg-indigo-100 text-indigo-800',
  RESTAURANT: 'bg-amber-100 text-amber-800',
  STUDY_SPOT: 'bg-blue-100 text-blue-800',
  CAFE: 'bg-yellow-100 text-yellow-800',
  NIGHTLIFE: 'bg-purple-100 text-purple-800',
  ON_CAMPUS: 'bg-gold-100 text-gold-800',
  CAMPUS_SPOT: 'bg-gold-100 text-gold-800',
}

function getPrimaryCategory(category: string): string {
  try {
    const parsed = JSON.parse(category)
    return Array.isArray(parsed) ? parsed[0] : category
  } catch {
    return category
  }
}

interface PageProps {
  params: { id: string }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      bio: true,
      role: true,
      university: true,
      avatarUrl: true,
      bannerColor: true,
      graduationYear: true,
      createdAt: true,
      _count: { select: { reviews: true, bracketVotes: true } },
    },
  })

  if (!user) {
    notFound()
  }

  // Get locations created by this user
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

  // Get reviews by this user
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

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const roleLabel = ROLE_OPTIONS[user.role] || user.role
  const roleColor = ROLE_COLORS[user.role] || ROLE_COLORS.OTHER

  // Unique universities and cities
  const uniqueUniversities = new Set(createdLocations.map(l => l.university).filter(Boolean))
  const uniqueCities = new Set(
    createdLocations
      .map(l => {
        // not available here, but we can count from reviews too
        return null
      })
      .filter(Boolean)
  )

  // Build scrapbook
  type ScrapbookEntry = {
    type: 'post' | 'review'
    locationId: string
    locationName: string
    category: string
    imageUrl: string
    avgRating: number
    university: string
    userRating?: number
    reviewSnippet?: string
    date: Date
  }

  const scrapbook: ScrapbookEntry[] = [
    ...createdLocations.map(loc => ({
      type: 'post' as const,
      locationId: loc.id,
      locationName: loc.name,
      category: loc.category,
      imageUrl: loc.imageUrl,
      avgRating: loc.avgRating,
      university: loc.university,
      date: loc.createdAt,
    })),
    ...reviews.map(rev => ({
      type: 'review' as const,
      locationId: rev.location.id,
      locationName: rev.location.name,
      category: rev.location.category,
      imageUrl: rev.location.imageUrl,
      avgRating: rev.location.avgRating,
      university: rev.location.university,
      userRating: rev.rating,
      reviewSnippet: rev.body.slice(0, 120),
      date: rev.createdAt,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-navy-700 transition-colors">Home</Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-navy-800 font-medium">{user.name}&apos;s Profile</span>
      </nav>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-md border border-silver-200 overflow-hidden">
          <div
            className={`h-32 relative ${user.bannerColor ? '' : 'bg-gradient-to-r from-navy-800 to-navy-600'}`}
            style={user.bannerColor ? { background: user.bannerColor } : undefined}
          >
            <div className="absolute -bottom-12 left-6">
              {user.avatarUrl ? (
                <div className="relative w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                  <Image src={user.avatarUrl} alt={user.name} fill className="object-cover" sizes="96px" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gold-500 flex items-center justify-center">
                  <span className="text-2xl font-black text-navy-900">{initials}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-16 px-6 pb-6">
            <h2 className="text-2xl font-black text-navy-800">{user.name}</h2>

            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${roleColor}`}>
                {roleLabel}
              </span>
              {user.university && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-navy-50 text-navy-700 border border-navy-200">
                  {user.university}
                </span>
              )}
              {user.graduationYear && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-silver-100 text-silver-700">
                  Class of {user.graduationYear}
                </span>
              )}
            </div>

            {user.bio && (
              <p className="mt-4 text-silver-600 leading-relaxed">{user.bio}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-silver-200 p-5 text-center">
            <div className="text-2xl font-black text-gold-500">{user._count.reviews}</div>
            <div className="text-sm text-silver-500 mt-1">Reviews</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-silver-200 p-5 text-center">
            <div className="text-2xl font-black text-gold-500">{createdLocations.length}</div>
            <div className="text-sm text-silver-500 mt-1">Posts</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-silver-200 p-5 text-center">
            <div className="text-2xl font-black text-gold-500">{user._count.bracketVotes}</div>
            <div className="text-sm text-silver-500 mt-1">Bracket Votes</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-silver-200 p-5 text-center">
            <div className="text-2xl font-black text-gold-500">{memberSince.split(' ')[0]}</div>
            <div className="text-sm text-silver-500 mt-1">Joined {memberSince.split(' ')[1]}</div>
          </div>
        </div>

        {/* Scrapbook */}
        {scrapbook.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md border border-silver-200 overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <h2 className="text-lg font-bold text-navy-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                {user.name.split(' ')[0]}&apos;s Scrapbook
              </h2>
            </div>

            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {scrapbook.map((entry, idx) => {
                  const primaryCat = getPrimaryCategory(entry.category)
                  const catLabel = CATEGORY_LABELS[primaryCat] || primaryCat
                  const catColor = CATEGORY_COLORS[primaryCat] || 'bg-silver-100 text-silver-700'
                  const dateStr = new Date(entry.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })

                  return (
                    <Link
                      key={`${entry.type}-${entry.locationId}-${idx}`}
                      href={`/locations/${entry.locationId}`}
                      className="group flex gap-3 p-3 rounded-xl border border-silver-200 hover:border-gold-300 hover:shadow-md transition-all bg-white"
                    >
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-silver-100">
                        <Image
                          src={entry.imageUrl}
                          alt={entry.locationName}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          sizes="80px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-sm text-navy-800 truncate group-hover:text-gold-600 transition-colors">
                            {entry.locationName}
                          </h3>
                          <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            entry.type === 'post'
                              ? 'bg-gold-100 text-gold-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {entry.type === 'post' ? 'Posted' : 'Reviewed'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${catColor}`}>
                            {catLabel}
                          </span>
                          {entry.university && (
                            <span className="text-[10px] text-silver-400 truncate">{entry.university}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-silver-500">
                          <span className="flex items-center gap-0.5">
                            <span className="text-yellow-500">&#9733;</span>
                            {entry.type === 'review' && entry.userRating != null
                              ? entry.userRating.toFixed(1)
                              : entry.avgRating.toFixed(1)}
                          </span>
                          <span>·</span>
                          <span>{dateStr}</span>
                        </div>
                        {entry.type === 'review' && entry.reviewSnippet && (
                          <p className="text-xs text-silver-500 mt-1 line-clamp-1 italic">
                            &ldquo;{entry.reviewSnippet}&rdquo;
                          </p>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
