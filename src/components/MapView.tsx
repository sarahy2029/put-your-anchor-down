'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Link from 'next/link'

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

interface MapViewProps {
  locations: MapLocation[]
  center?: [number, number]
  zoom?: number
}

const CATEGORY_COLORS: Record<string, string> = {
  OUTDOORS: '#16a34a',
  ATTRACTION: '#6366f1',
  RESTAURANT: '#d97706',
  STUDY_SPOT: '#2563eb',
  CAFE: '#b45309',
  NIGHTLIFE: '#9333ea',
  ON_CAMPUS: '#ca8a04',
  CAMPUS_SPOT: '#ca8a04',
}

function createAnchorIcon(category: string) {
  const color = CATEGORY_COLORS[category] || '#ca8a04'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
    <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24C32 7.16 24.84 0 16 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
    <circle cx="16" cy="10" r="3" fill="#fff"/>
    <line x1="16" y1="13" x2="16" y2="24" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M10 20 C10 17 16 17 16 17 C16 17 22 17 22 20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
    <line x1="10 " y1="20" x2="10" y2="18" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
    <line x1="22" y1="20" x2="22" y2="18" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
  </svg>`

  return L.divIcon({
    html: svg,
    className: 'anchor-marker',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  })
}

function FitBounds({ locations }: { locations: MapLocation[] }) {
  const map = useMap()

  useEffect(() => {
    const validLocs = locations.filter(l => l.latitude && l.longitude)
    if (validLocs.length === 0) return

    if (validLocs.length === 1) {
      map.setView([validLocs[0].latitude!, validLocs[0].longitude!], 14)
      return
    }

    const bounds = L.latLngBounds(
      validLocs.map(l => [l.latitude!, l.longitude!] as [number, number])
    )
    map.fitBounds(bounds, { padding: [50, 50] })
  }, [locations, map])

  return null
}

function getPrimaryCategory(category: string): string {
  try {
    const parsed = JSON.parse(category)
    return Array.isArray(parsed) ? parsed[0] : category
  } catch {
    return category
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  OUTDOORS: 'Outdoors',
  ATTRACTION: 'Attractions',
  RESTAURANT: 'Restaurants',
  STUDY_SPOT: 'Study Spots',
  CAFE: 'Cafes',
  NIGHTLIFE: 'Nightlife',
  ON_CAMPUS: 'On Campus',
  CAMPUS_SPOT: 'Campus Spot',
}

export default function MapView({ locations, center, zoom }: MapViewProps) {
  const validLocations = locations.filter(l => l.latitude && l.longitude)
  const defaultCenter: [number, number] = center || [38.03, -78.50]
  const defaultZoom = zoom || 13

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      className="w-full h-full"
      zoomControl={true}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds locations={validLocations} />
      {validLocations.map(loc => {
        const primaryCat = getPrimaryCategory(loc.category)
        const catLabel = CATEGORY_LABELS[primaryCat] || primaryCat
        const catColor = CATEGORY_COLORS[primaryCat] || '#ca8a04'

        return (
          <Marker
            key={loc.id}
            position={[loc.latitude!, loc.longitude!]}
            icon={createAnchorIcon(primaryCat)}
          >
            <Popup>
              <div className="min-w-[180px]">
                <h3 className="font-bold text-sm text-gray-900 mb-1">{loc.name}</h3>
                <span
                  className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full text-white mb-1"
                  style={{ backgroundColor: catColor }}
                >
                  {catLabel}
                </span>
                <p className="text-xs text-gray-500 mb-1">{loc.address}</p>
                <div className="flex items-center gap-1 text-xs mb-2">
                  <span className="text-yellow-500">&#9733;</span>
                  <span className="font-semibold">{loc.avgRating.toFixed(1)}</span>
                  <span className="text-gray-400">({loc.reviewCount} reviews)</span>
                </div>
                {loc.vibes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {loc.vibes.slice(0, 3).map(v => (
                      <span key={v} className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{v}</span>
                    ))}
                  </div>
                )}
                <Link
                  href={`/locations/${loc.id}`}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  View details &rarr;
                </Link>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
