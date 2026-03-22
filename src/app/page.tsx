'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import StarRating from '@/components/StarRating'
import UniversitySearch from '@/components/UniversitySearch'
import { useUniversity } from '@/context/UniversityContext'

const categoryConfig: Record<
  string,
  { label: string; bgColor: string; textColor: string; emoji: string }
> = {
  OUTDOORS: { label: 'Outdoors', bgColor: 'bg-green-100', textColor: 'text-green-800', emoji: '🌿' },
  ATTRACTION: { label: 'Attractions', bgColor: 'bg-silver-200', textColor: 'text-navy-800', emoji: '🗺️' },
  RESTAURANT: { label: 'Restaurants', bgColor: 'bg-gold-200', textColor: 'text-gold-900', emoji: '🍽️' },
  STUDY_SPOT: { label: 'Study Spots', bgColor: 'bg-blue-100', textColor: 'text-blue-800', emoji: '📚' },
  CAFE: { label: 'Cafes', bgColor: 'bg-amber-100', textColor: 'text-amber-800', emoji: '☕' },
  NIGHTLIFE: { label: 'Nightlife', bgColor: 'bg-purple-100', textColor: 'text-purple-800', emoji: '🌙' },
  ON_CAMPUS: { label: 'On Campus', bgColor: 'bg-gold-100', textColor: 'text-gold-800', emoji: '🏛️' },
  CAMPUS_SPOT: { label: 'Campus Spot', bgColor: 'bg-gold-100', textColor: 'text-gold-800', emoji: '🎓' },
}

interface Location {
  id: string
  name: string
  description: string
  category: string
  address: string
  imageUrl: string
  vibes: string[]
  priceLevel: string
  university: string
  avgWaitMinutes: number
  avgRating: number
  reviewCount: number
}

export default function HomePage() {
  const { selectedUniversity } = useUniversity()
  const [featuredLocations, setFeaturedLocations] = useState<(Location | null)[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch featured locations when university is selected
  useEffect(() => {
    if (!selectedUniversity) {
      setFeaturedLocations([])
      return
    }

    setLoading(true)
    fetch(`/api/locations?university=${encodeURIComponent(selectedUniversity.name)}`)
      .then((r) => r.json())
      .then((locations: Location[]) => {
        const categories = ['CAMPUS_SPOT', 'RESTAURANT', 'ATTRACTION']
        const featured = categories.map(
          (cat) => locations.find((l) => {
            let locCats: string[]
            try {
              locCats = JSON.parse(l.category)
            } catch {
              locCats = [l.category]
            }
            return locCats.includes(cat)
          }) || null
        )
        // If we have fewer than 3 featured, fill with top remaining locations
        if (featured.filter(Boolean).length < 3 && locations.length > 0) {
          const featuredIds = new Set(featured.filter(Boolean).map(l => l!.id))
          for (let i = 0; i < featured.length; i++) {
            if (!featured[i]) {
              const fill = locations.find(l => !featuredIds.has(l.id))
              if (fill) {
                featured[i] = fill
                featuredIds.add(fill.id)
              }
            }
          }
        }
        setFeaturedLocations(featured)
      })
      .catch(() => setFeaturedLocations([]))
      .finally(() => setLoading(false))
  }, [selectedUniversity])

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-300 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold-200 rounded-full opacity-10 translate-y-1/2 -translate-x-1/2" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <Image
                src="/logo.png"
                alt="Put Your Anchor Down"
                width={120}
                height={120}
                className="w-28 h-28 md:w-32 md:h-32 object-contain"
                priority
              />
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-navy-800 mb-4 leading-tight">
              Put Your
              <br />
              <span className="text-gold-500">Anchor Down.</span>
            </h1>
            <p className="text-lg md:text-xl text-silver-600 max-w-2xl mx-auto mb-10">
              Discover the best spots near campus — rated and reviewed by students
              just like you.
            </p>

            {/* University Search */}
            <div className="max-w-lg mx-auto mb-10">
              <label className="block text-sm font-semibold text-navy-700 mb-2">
                Find your university
              </label>
              <div className="flex justify-center">
                <UniversitySearch size="lg" showClear />
              </div>
            </div>

            {/* Stats — show when no university selected */}
            {!selectedUniversity && (
              <div className="mt-8 grid grid-cols-3 gap-8 max-w-md mx-auto">
                {[
                  { label: 'Locations', value: '8+' },
                  { label: 'Reviews', value: '50+' },
                  { label: '.edu Only', value: '100%' },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <div className="text-2xl font-black text-gold-500">{value}</div>
                    <div className="text-sm text-silver-600 mt-1">{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Section — only show when university is selected */}
      {selectedUniversity && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-navy-800 mb-3">
              Top Picks at {selectedUniversity.name}
            </h2>
            <p className="text-silver-500 max-w-lg mx-auto">
              The most talked-about places — chosen by your fellow students.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse border border-silver-200">
                  <div className="h-56 bg-silver-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-silver-200 rounded w-3/4" />
                    <div className="h-3 bg-silver-200 rounded w-1/2" />
                    <div className="h-3 bg-silver-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredLocations.filter(Boolean).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredLocations.map((location, idx) => {
                if (!location) return null
                let locCategories: string[]
                try {
                  locCategories = JSON.parse(location.category)
                } catch {
                  locCategories = [location.category]
                }
                const primaryCat = locCategories[0]
                const primaryConfig = categoryConfig[primaryCat] || { label: primaryCat, bgColor: 'bg-gray-100', textColor: 'text-gray-800', emoji: '📍' }

                return (
                  <Link key={location.id} href={`/locations/${location.id}`}>
                    <div className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-silver-200 hover:border-gold-400 hover:-translate-y-2">
                      <div className="relative h-56 overflow-hidden">
                        <Image
                          src={location.imageUrl}
                          alt={location.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute top-4 left-4 flex flex-wrap gap-1">
                          {locCategories.slice(0, 2).map((cat) => {
                            const config = categoryConfig[cat] || { label: cat, bgColor: 'bg-gray-100', textColor: 'text-gray-800', emoji: '📍' }
                            return (
                              <span key={cat} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${config.bgColor} ${config.textColor}`}>
                                {config.emoji} {config.label}
                              </span>
                            )
                          })}
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-white font-black text-xl leading-tight drop-shadow-lg">
                            {location.name}
                          </h3>
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <StarRating rating={location.avgRating} size="sm" />
                            <span className="font-bold text-navy-800">
                              {location.avgRating > 0 ? location.avgRating.toFixed(1) : '—'}
                            </span>
                            <span className="text-silver-500 text-sm">
                              ({location.reviewCount} reviews)
                            </span>
                          </div>
                        </div>
                        <p className="text-silver-600 text-sm leading-relaxed line-clamp-2 mb-4">
                          {location.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {location.vibes.slice(0, 3).map((vibe) => (
                            <span key={vibe} className="bg-navy-50 text-navy-700 px-2.5 py-1 rounded-full text-xs font-medium border border-silver-200">
                              {vibe}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center text-gold-600 font-semibold text-sm group-hover:text-gold-500">
                          View details
                          <svg className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-silver-500 text-lg">No locations found for this university yet.</p>
              <Link href="/locations/new" className="inline-block mt-4 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold px-6 py-3 rounded-xl transition-colors">
                Be the first to add one!
              </Link>
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              href="/locations"
              className="inline-flex items-center gap-2 bg-navy-800 hover:bg-navy-700 text-white font-bold px-8 py-4 rounded-xl transition-colors"
            >
              View All at {selectedUniversity.name}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="bg-navy-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-gold-400 text-center mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Pick Your University',
                description:
                  'Search for your university to see campus spots, restaurants, and attractions reviewed by students at your school.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'Sign In with .edu',
                description:
                  'Create an account using your university email. Only verified students can post reviews — keeping the community authentic.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Share Your Experience',
                description:
                  'Rate places, write reviews, share wait times and vibes. Help your fellow students discover great spots.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                ),
              },
            ].map(({ step, title, description, icon }) => (
              <div key={step} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-500/20 rounded-2xl text-gold-400 mb-4">
                  {icon}
                </div>
                <div className="text-gold-400 font-black text-sm mb-2 tracking-wider">
                  STEP {step}
                </div>
                <h3 className="text-gold-300 font-bold text-xl mb-3">{title}</h3>
                <p className="text-silver-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
