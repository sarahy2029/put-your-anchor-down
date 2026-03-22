import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import StarRating from '@/components/StarRating'
import ReviewSection from './ReviewSection'
import LocationActions from './LocationActions'

const categoryConfig: Record<
  string,
  { label: string; bgColor: string; textColor: string }
> = {
  OUTDOORS: { label: 'Outdoors', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  ATTRACTION: { label: 'Attractions', bgColor: 'bg-silver-200', textColor: 'text-navy-800' },
  RESTAURANT: { label: 'Restaurants', bgColor: 'bg-gold-200', textColor: 'text-gold-900' },
  STUDY_SPOT: { label: 'Study Spots', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
  CAFE: { label: 'Cafes', bgColor: 'bg-amber-100', textColor: 'text-amber-800' },
  NIGHTLIFE: { label: 'Nightlife', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
  ON_CAMPUS: { label: 'On Campus', bgColor: 'bg-gold-100', textColor: 'text-gold-800' },
  CAMPUS_SPOT: { label: 'Campus Spot', bgColor: 'bg-gold-100', textColor: 'text-gold-800' },
}

const priceLevelMap: Record<string, string> = {
  FREE: 'Free',
  DOLLAR: '$',
  TWO_DOLLAR: '$$',
  THREE_DOLLAR: '$$$',
}

interface PageProps {
  params: { id: string }
}

async function getLocation(id: string) {
  try {
    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    return location
  } catch {
    return null
  }
}

export default async function LocationDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  const location = await getLocation(params.id)

  if (!location) {
    notFound()
  }

  const vibes = JSON.parse(location.vibes) as string[]
  let parsedCategories: string[]
  try {
    parsedCategories = JSON.parse(location.category)
  } catch {
    parsedCategories = [location.category]
  }
  const catConfig = categoryConfig[parsedCategories[0]] || {
    label: parsedCategories[0],
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
  }

  const reviews = location.reviews.map((r) => ({
    ...r,
    vibes: JSON.parse(r.vibes) as string[],
  }))

  const isSignedIn = !!session?.user?.email
  const isEduUser = isSignedIn && session.user!.email!.endsWith('.edu')

  // Check if the current user is the post creator
  let isOwner = false
  let currentUserId: string | null = null
  if (isSignedIn) {
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user!.email! },
      select: { id: true },
    })
    currentUserId = currentUser?.id ?? null
    isOwner = !!currentUser && location.createdBy === currentUser.id
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-navy-700 transition-colors">
          Home
        </Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link href="/locations" className="hover:text-navy-700 transition-colors">
          Explore
        </Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-navy-800 font-medium truncate max-w-xs">
          {location.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Hero Image */}
          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-6 shadow-lg">
            <Image
              src={location.imageUrl}
              alt={location.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 66vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5">
              <div className="flex items-end justify-between">
                <div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {parsedCategories.map((cat) => {
                      const config = categoryConfig[cat] || { label: cat, bgColor: 'bg-gray-100', textColor: 'text-gray-800' }
                      return (
                        <span
                          key={cat}
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${config.bgColor} ${config.textColor}`}
                        >
                          {config.label}
                        </span>
                      )
                    })}
                  </div>
                  <h1 className="text-white font-black text-3xl drop-shadow-lg">
                    {location.name}
                  </h1>
                </div>
              </div>
            </div>
          </div>

          {/* Owner Actions */}
          {isOwner && (
            <LocationActions
              locationId={location.id}
              location={{
                name: location.name,
                description: location.description,
                address: location.address,
                category: location.category,
                vibes: vibes,
                priceLevel: location.priceLevel,
                imageUrl: location.imageUrl,
                university: location.university,
              }}
            />
          )}

          {/* Description */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
            <h2 className="text-navy-800 font-bold text-xl mb-3">About</h2>
            <p className="text-gray-600 leading-relaxed">{location.description}</p>
          </div>

          {/* Reviews Section (Client Component) */}
          <ReviewSection
            locationId={location.id}
            initialReviews={reviews}
            isEduUser={isEduUser}
            currentUserId={currentUserId}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Stats Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-navy-800 font-bold text-lg mb-4">Quick Info</h2>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <div className="text-3xl font-black text-navy-800">
                {location.avgRating > 0 ? location.avgRating.toFixed(1) : '—'}
              </div>
              <div>
                <StarRating rating={location.avgRating} size="md" />
                <p className="text-sm text-gray-500 mt-0.5">
                  {location.reviewCount}{' '}
                  {location.reviewCount === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                    Address
                  </p>
                  <p className="text-gray-700 text-sm">{location.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                    Price
                  </p>
                  <p className="text-gray-700 text-sm font-semibold">
                    {priceLevelMap[location.priceLevel] || location.priceLevel}
                  </p>
                </div>
              </div>

              {location.avgWaitMinutes > 0 && (
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                      Avg Wait
                    </p>
                    <p className="text-gray-700 text-sm">
                      ~{Math.round(location.avgWaitMinutes)} minutes
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vibes Card */}
          {vibes.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-navy-800 font-bold text-lg mb-4">Vibes</h2>
              <div className="flex flex-wrap gap-2">
                {vibes.map((vibe) => (
                  <span
                    key={vibe}
                    className="bg-navy-50 text-navy-700 border border-navy-200 px-3 py-1.5 rounded-full text-sm font-medium"
                  >
                    {vibe}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sign-in prompt */}
          {!isSignedIn && (
            <div className="bg-gradient-to-br from-navy-800 to-navy-700 rounded-xl p-6 text-white">
              <h3 className="font-bold text-lg mb-2">Share Your Experience</h3>
              <p className="text-gray-300 text-sm mb-4">
                Sign in with your .edu email to write a review and help fellow
                students.
              </p>
              <Link
                href={`/auth/signin?callbackUrl=/locations/${location.id}`}
                className="block w-full bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold py-2.5 px-4 rounded-lg text-center transition-colors text-sm"
              >
                Sign In to Review
              </Link>
            </div>
          )}

          {isSignedIn && !isEduUser && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-amber-800 text-sm">
                Only .edu email addresses can post reviews.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
