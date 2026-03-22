'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useUniversity } from '@/context/UniversityContext'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

interface MapLocation {
  id: string
  name: string
  category: string
  address: string
  imageUrl: string
  avgRating: number
  reviewCount: number
  latitude: number | null
  longitude: number | null
  vibes: string[]
  priceLevel: string
}

const CATEGORIES = [
  { value: 'ALL', label: 'All', emoji: '📍' },
  { value: 'OUTDOORS', label: 'Outdoors', emoji: '🌿' },
  { value: 'ATTRACTION', label: 'Attractions', emoji: '🗺️' },
  { value: 'RESTAURANT', label: 'Restaurants', emoji: '🍽️' },
  { value: 'STUDY_SPOT', label: 'Study Spots', emoji: '📚' },
  { value: 'CAFE', label: 'Cafes', emoji: '☕' },
  { value: 'NIGHTLIFE', label: 'Nightlife', emoji: '🌙' },
  { value: 'ON_CAMPUS', label: 'On Campus', emoji: '🏛️' },
  { value: 'CAMPUS_SPOT', label: 'Campus', emoji: '🎓' },
]

const VIBES = [
  'Chill', 'Lively', 'Study-Friendly', 'Social',
  'Romantic', 'Adventurous', 'Outdoorsy', 'Late-Night',
  'Family-Friendly', 'Hidden Gem',
]

const PRICE_LEVELS = [
  { value: 'ALL', label: 'Any Price' },
  { value: 'FREE', label: 'Free' },
  { value: 'DOLLAR', label: '$' },
  { value: 'TWO_DOLLAR', label: '$$' },
  { value: 'THREE_DOLLAR', label: '$$$' },
]

export default function MapPage() {
  const { selectedUniversity } = useUniversity()
  const [locations, setLocations] = useState<MapLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Filters
  const [category, setCategory] = useState('ALL')
  const [selectedVibes, setSelectedVibes] = useState<string[]>([])
  const [priceLevel, setPriceLevel] = useState('ALL')

  useEffect(() => {
    async function fetchLocations() {
      setLoading(true)
      try {
        const uni = selectedUniversity?.name
        const url = uni
          ? `/api/locations?university=${encodeURIComponent(uni)}`
          : '/api/locations'
        const res = await fetch(url)
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        setLocations(data)
      } catch {
        setLocations([])
      } finally {
        setLoading(false)
      }
    }
    fetchLocations()
  }, [selectedUniversity])

  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      // Category filter
      if (category !== 'ALL') {
        let locCategories: string[]
        try {
          locCategories = JSON.parse(loc.category)
        } catch {
          locCategories = [loc.category]
        }
        if (!locCategories.includes(category)) return false
      }
      // Vibes filter
      if (selectedVibes.length > 0) {
        if (!selectedVibes.every(v => loc.vibes.includes(v))) return false
      }
      // Price filter
      if (priceLevel !== 'ALL' && loc.priceLevel !== priceLevel) return false

      return true
    })
  }, [locations, category, selectedVibes, priceLevel])

  const toggleVibe = (vibe: string) => {
    setSelectedVibes(prev =>
      prev.includes(vibe) ? prev.filter(v => v !== vibe) : [...prev, vibe]
    )
  }

  const clearFilters = () => {
    setCategory('ALL')
    setSelectedVibes([])
    setPriceLevel('ALL')
  }

  const activeFilterCount =
    (category !== 'ALL' ? 1 : 0) +
    selectedVibes.length +
    (priceLevel !== 'ALL' ? 1 : 0)

  const mapCenter: [number, number] | undefined = selectedUniversity
    ? [selectedUniversity.lat, selectedUniversity.lng]
    : undefined

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } transition-all duration-300 bg-white border-r border-silver-200 flex-shrink-0 overflow-hidden`}
      >
        <div className="w-72 h-full overflow-y-auto p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-navy-800">Filters</h2>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-gold-600 hover:text-gold-700 font-semibold"
              >
                Clear all
              </button>
            )}
          </div>

          {/* University indicator */}
          {selectedUniversity && (
            <div className="bg-navy-50 rounded-lg px-3 py-2 mb-4">
              <p className="text-xs text-navy-600 font-semibold">Showing locations near</p>
              <p className="text-sm font-bold text-navy-800">{selectedUniversity.name}</p>
            </div>
          )}

          {/* Results count */}
          <p className="text-xs text-silver-500 mb-4">
            <span className="font-bold text-navy-800">{filteredLocations.filter(l => l.latitude && l.longitude).length}</span> locations on map
          </p>

          {/* Categories */}
          <div className="mb-5">
            <h3 className="text-xs font-bold text-silver-500 uppercase tracking-wide mb-2">Category</h3>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    category === cat.value
                      ? 'bg-gold-500 text-navy-900 shadow-sm'
                      : 'bg-silver-50 text-silver-600 hover:bg-silver-100 border border-silver-200'
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vibes */}
          <div className="mb-5">
            <h3 className="text-xs font-bold text-silver-500 uppercase tracking-wide mb-2">Vibes</h3>
            <div className="flex flex-wrap gap-1.5">
              {VIBES.map(vibe => (
                <button
                  key={vibe}
                  onClick={() => toggleVibe(vibe)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedVibes.includes(vibe)
                      ? 'bg-navy-700 text-white'
                      : 'bg-white text-silver-600 border border-silver-200 hover:border-navy-300'
                  }`}
                >
                  {vibe}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="mb-5">
            <h3 className="text-xs font-bold text-silver-500 uppercase tracking-wide mb-2">Price</h3>
            <div className="flex flex-wrap gap-1.5">
              {PRICE_LEVELS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPriceLevel(p.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    priceLevel === p.value
                      ? 'bg-gold-500 text-navy-900 shadow-sm'
                      : 'bg-silver-50 text-silver-600 hover:bg-silver-100 border border-silver-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div>
            <h3 className="text-xs font-bold text-silver-500 uppercase tracking-wide mb-2">Legend</h3>
            <div className="space-y-1.5">
              {CATEGORIES.filter(c => c.value !== 'ALL').map(cat => {
                const colors: Record<string, string> = {
                  OUTDOORS: '#16a34a', ATTRACTION: '#6366f1', RESTAURANT: '#d97706',
                  STUDY_SPOT: '#2563eb', CAFE: '#b45309', NIGHTLIFE: '#9333ea',
                  ON_CAMPUS: '#ca8a04', CAMPUS_SPOT: '#ca8a04',
                }
                return (
                  <div key={cat.value} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colors[cat.value] }} />
                    <span className="text-xs text-silver-600">{cat.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        {/* Toggle sidebar button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-3 left-3 z-[1000] bg-white shadow-md border border-silver-200 rounded-lg px-3 py-2 text-sm font-semibold text-navy-700 hover:bg-silver-50 transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-gold-500 text-navy-900 text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {loading ? (
          <div className="w-full h-full flex items-center justify-center bg-silver-50">
            <div className="text-center">
              <svg className="w-8 h-8 animate-spin text-gold-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-silver-500 text-sm">Loading map...</p>
            </div>
          </div>
        ) : (
          <MapView
            locations={filteredLocations}
            center={mapCenter}
          />
        )}
      </div>
    </div>
  )
}
