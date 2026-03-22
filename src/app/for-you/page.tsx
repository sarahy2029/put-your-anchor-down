'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import LocationCard from '@/components/LocationCard'

interface RecommendedLocation {
  id: string
  name: string
  description: string
  address: string
  imageUrl: string
  category: string
  vibes: string[]
  priceLevel: string
  avgRating: number
  reviewCount: number
  avgWaitMinutes: number
  score: number
  reasons: string[]
}

interface Section {
  title: string
  subtitle: string
  icon: string
  locations: RecommendedLocation[]
}

interface RecommendationData {
  hasActivity: boolean
  userStats?: {
    reviewCount: number
    postCount: number
    topCategories: string[]
    topVibes: string[]
  }
  sections: Section[]
}

const sectionIcons: Record<string, React.ReactNode> = {
  sparkles: (
    <svg className="w-6 h-6 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  trending: (
    <svg className="w-6 h-6 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  gem: (
    <svg className="w-6 h-6 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l2.5 4h5l-3.5 5 1.5 5-5.5-3-5.5 3 1.5-5-3.5-5h5L12 3z" />
    </svg>
  ),
  wallet: (
    <svg className="w-6 h-6 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  nature: (
    <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  food: (
    <svg className="w-6 h-6 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
    </svg>
  ),
  study: (
    <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  cafe: (
    <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h12a2 2 0 012 2v2a2 2 0 01-2 2h-2v2a4 4 0 01-4 4H8a4 4 0 01-4-4V4zm14 4h2a2 2 0 010 4h-2M4 18h12" />
    </svg>
  ),
  nightlife: (
    <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  campus: (
    <svg className="w-6 h-6 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  attraction: (
    <svg className="w-6 h-6 text-navy-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  default: (
    <svg className="w-6 h-6 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
}

export default function ForYouPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<RecommendationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/for-you')
      return
    }
    if (status === 'authenticated') {
      fetch('/api/recommendations')
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load recommendations')
          return res.json()
        })
        .then((d) => setData(d))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false))
    }
  }, [status, router])

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-10 w-48 bg-gray-200 rounded-lg" />
          <div className="h-6 w-96 bg-gray-100 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-5 w-3/4 bg-gray-200 rounded" />
                  <div className="h-4 w-1/2 bg-gray-100 rounded" />
                  <div className="h-4 w-full bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-navy-800 font-bold text-2xl mb-2">Something went wrong</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold px-6 py-2.5 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gold-100 rounded-xl">
            <svg className="w-7 h-7 text-gold-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-navy-800 font-black text-3xl">For You</h1>
            <p className="text-gray-500 text-sm">
              {data.hasActivity
                ? 'Personalized recommendations based on your activity'
                : 'Start exploring and reviewing to get personalized picks!'}
            </p>
          </div>
        </div>
      </div>

      {/* User taste profile */}
      {data.hasActivity && data.userStats && (
        <div className="bg-gradient-to-r from-navy-800 to-navy-700 rounded-2xl p-6 mb-8 text-white">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Your Taste Profile
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-gold-400">{data.userStats.reviewCount}</div>
              <div className="text-xs text-gray-300 mt-0.5">Reviews</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-gold-400">{data.userStats.postCount}</div>
              <div className="text-xs text-gray-300 mt-0.5">Posts</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-xs text-gray-300 mb-1">Top Categories</div>
              <div className="flex flex-wrap gap-1">
                {data.userStats.topCategories.map((cat) => (
                  <span key={cat} className="text-xs bg-gold-500/20 text-gold-300 px-2 py-0.5 rounded-full">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-xs text-gray-300 mb-1">Favorite Vibes</div>
              <div className="flex flex-wrap gap-1">
                {data.userStats.topVibes.map((vibe) => (
                  <span key={vibe} className="text-xs bg-gold-500/20 text-gold-300 px-2 py-0.5 rounded-full">
                    {vibe}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No recommendations fallback */}
      {data.sections.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🧭</div>
          <h2 className="text-navy-800 font-bold text-2xl mb-2">No recommendations yet</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            We need more places in the system to find matches for you. Be the first to add some!
          </p>
          <Link
            href="/locations/new"
            className="inline-block bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold px-6 py-2.5 rounded-lg transition-colors"
          >
            Create a Post
          </Link>
        </div>
      )}

      {/* Recommendation sections */}
      <div className="space-y-10">
        {data.sections.map((section, idx) => (
          <div key={idx}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-1.5 bg-gray-50 rounded-lg border border-gray-100">
                {sectionIcons[section.icon] || sectionIcons.default}
              </div>
              <div>
                <h2 className="text-navy-800 font-bold text-xl">{section.title}</h2>
                <p className="text-gray-500 text-sm">{section.subtitle}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {section.locations.map((loc) => (
                <div key={loc.id} className="relative">
                  <LocationCard
                    id={loc.id}
                    name={loc.name}
                    category={loc.category}
                    description={loc.description}
                    address={loc.address}
                    imageUrl={loc.imageUrl}
                    vibes={loc.vibes}
                    priceLevel={loc.priceLevel}
                    avgRating={loc.avgRating}
                    reviewCount={loc.reviewCount}
                    avgWaitMinutes={loc.avgWaitMinutes}
                  />
                  {/* Reason tags */}
                  {loc.reasons.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {loc.reasons.map((reason, i) => (
                        <span
                          key={i}
                          className="text-xs bg-gold-50 text-gold-700 border border-gold-200 px-2 py-0.5 rounded-full"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CTA at bottom */}
      {data.hasActivity && (
        <div className="mt-12 text-center pb-8">
          <p className="text-gray-500 text-sm mb-3">
            Want better recommendations? Keep reviewing and posting!
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/locations"
              className="bg-white border border-gray-300 hover:border-gold-400 text-navy-800 font-semibold px-5 py-2 rounded-lg transition-colors text-sm"
            >
              Explore All Places
            </Link>
            <Link
              href="/locations/new"
              className="bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold px-5 py-2 rounded-lg transition-colors text-sm"
            >
              Create a Post
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
