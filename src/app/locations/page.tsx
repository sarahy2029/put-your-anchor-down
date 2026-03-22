'use client'

import { useState, useEffect, useCallback } from 'react'
import LocationCard from '@/components/LocationCard'
import FilterBar, { FilterState } from '@/components/FilterBar'
import UniversitySearch from '@/components/UniversitySearch'
import { useUniversity } from '@/context/UniversityContext'

interface Location {
  id: string
  name: string
  category: string
  description: string
  address: string
  imageUrl: string
  vibes: string[]
  priceLevel: string
  avgRating: number
  reviewCount: number
  avgWaitMinutes: number
}

function matchesWaitFilter(avgWait: number, waitFilter: string): boolean {
  switch (waitFilter) {
    case 'UNDER_5':
      return avgWait < 5
    case '5_15':
      return avgWait >= 5 && avgWait < 15
    case '15_30':
      return avgWait >= 15 && avgWait < 30
    case '30_PLUS':
      return avgWait >= 30
    default:
      return true
  }
}

export default function LocationsPage() {
  const { selectedUniversity } = useUniversity()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    category: 'ALL',
    vibes: [],
    priceLevel: 'ALL',
    waitTime: 'ANY',
  })

  useEffect(() => {
    async function fetchLocations() {
      try {
        setLoading(true)
        // Use shared university context, fall back to URL param, then all locations
        const params = new URLSearchParams(window.location.search)
        const uni = selectedUniversity?.name || params.get('university')
        const url = uni
          ? `/api/locations?university=${encodeURIComponent(uni)}`
          : '/api/locations'
        const res = await fetch(url)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setLocations(data)
      } catch {
        setError('Failed to load locations. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchLocations()
  }, [selectedUniversity])

  // Read URL params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const cat = params.get('category')
      if (cat) {
        setFilters((f) => ({ ...f, category: cat }))
      }
    }
  }, [])

  const filteredLocations = locations.filter((loc) => {
    if (filters.category !== 'ALL') {
      let locCategories: string[]
      try {
        locCategories = JSON.parse(loc.category)
      } catch {
        locCategories = [loc.category]
      }
      if (!locCategories.includes(filters.category)) return false
    }

    if (filters.vibes.length > 0) {
      const hasAllVibes = filters.vibes.every((v) => loc.vibes.includes(v))
      if (!hasAllVibes) return false
    }

    if (filters.priceLevel !== 'ALL' && loc.priceLevel !== filters.priceLevel) {
      return false
    }

    if (!matchesWaitFilter(loc.avgWaitMinutes, filters.waitTime)) {
      return false
    }

    return true
  })

  const activeFilterCount =
    (filters.category !== 'ALL' ? 1 : 0) +
    filters.vibes.length +
    (filters.priceLevel !== 'ALL' ? 1 : 0) +
    (filters.waitTime !== 'ANY' ? 1 : 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-black text-navy-800 mb-1">
              Explore Places
            </h1>
            <p className="text-gray-500">
              {selectedUniversity
                ? `Showing locations near ${selectedUniversity.name}`
                : 'Discover campus spots, restaurants, and local attractions — all rated by students.'}
            </p>
          </div>
          <UniversitySearch size="sm" showClear />
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-24">
            <FilterBar filters={filters} onFilterChange={setFilters} />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Mobile filter button */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-gold-500 text-navy-900 text-xs font-bold rounded-full px-1.5 py-0.5 min-w-5 text-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {sidebarOpen && (
              <div className="mt-3">
                <FilterBar filters={filters} onFilterChange={setFilters} />
              </div>
            )}
          </div>

          {/* Results info */}
          {!loading && (
            <div className="flex items-center justify-between mb-5">
              <p className="text-gray-500 text-sm">
                <span className="font-semibold text-navy-800">
                  {filteredLocations.length}
                </span>{' '}
                {filteredLocations.length === 1 ? 'place' : 'places'} found
                {activeFilterCount > 0 && (
                  <span className="ml-1">
                    with{' '}
                    <span className="text-gold-600 font-medium">
                      {activeFilterCount} filter
                      {activeFilterCount !== 1 ? 's' : ''}
                    </span>
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse"
                >
                  <div className="h-48 bg-gray-200" />
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3 mb-3" />
                    <div className="h-3 bg-gray-200 rounded" />
                    <div className="h-3 bg-gray-200 rounded w-4/5 mt-2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filteredLocations.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-navy-800 mb-2">
                No places match your filters
              </h3>
              <p className="text-gray-500 mb-6">
                Try adjusting or clearing your filters to see more results.
              </p>
              <button
                onClick={() =>
                  setFilters({
                    category: 'ALL',
                    vibes: [],
                    priceLevel: 'ALL',
                    waitTime: 'ANY',
                  })
                }
                className="bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold px-6 py-3 rounded-lg transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Location Grid */}
          {!loading && !error && filteredLocations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredLocations.map((location) => (
                <LocationCard
                  key={location.id}
                  id={location.id}
                  name={location.name}
                  category={location.category}
                  description={location.description}
                  address={location.address}
                  imageUrl={location.imageUrl}
                  vibes={location.vibes}
                  priceLevel={location.priceLevel}
                  avgRating={location.avgRating}
                  reviewCount={location.reviewCount}
                  avgWaitMinutes={location.avgWaitMinutes}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
