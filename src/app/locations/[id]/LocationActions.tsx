'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORY_OPTIONS = [
  { value: 'OUTDOORS', label: 'Outdoors' },
  { value: 'ATTRACTION', label: 'Attractions' },
  { value: 'RESTAURANT', label: 'Restaurants' },
  { value: 'STUDY_SPOT', label: 'Study Spots' },
  { value: 'CAFE', label: 'Cafes' },
  { value: 'NIGHTLIFE', label: 'Nightlife' },
  { value: 'ON_CAMPUS', label: 'On Campus' },
]

const PRICE_OPTIONS = [
  { value: 'FREE', label: 'Free' },
  { value: 'DOLLAR', label: '$' },
  { value: 'TWO_DOLLAR', label: '$$' },
  { value: 'THREE_DOLLAR', label: '$$$' },
]

const VIBE_OPTIONS = [
  'Chill', 'Lively', 'Study-Friendly', 'Social',
  'Romantic', 'Adventurous', 'Outdoorsy', 'Late-Night',
  'Family-Friendly', 'Hidden Gem',
]

interface LocationActionsProps {
  locationId: string
  location: {
    name: string
    description: string
    address: string
    category: string
    vibes: string[]
    priceLevel: string
    imageUrl: string
    university: string
  }
}

export default function LocationActions({ locationId, location }: LocationActionsProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Parse categories from JSON
  let initialCategories: string[]
  try {
    initialCategories = JSON.parse(location.category)
  } catch {
    initialCategories = [location.category]
  }

  const [name, setName] = useState(location.name)
  const [description, setDescription] = useState(location.description)
  const [address, setAddress] = useState(location.address)
  const [categories, setCategories] = useState<string[]>(initialCategories)
  const [vibes, setVibes] = useState<string[]>(location.vibes)
  const [priceLevel, setPriceLevel] = useState(location.priceLevel)
  const [imageUrl, setImageUrl] = useState(location.imageUrl)
  const [university, setUniversity] = useState(location.university)

  const handleSave = async () => {
    setError('')
    if (!name.trim() || name.trim().length < 2) return setError('Name must be at least 2 characters.')
    if (!description.trim() || description.trim().length < 10) return setError('Description must be at least 10 characters.')
    if (!address.trim() || address.trim().length < 5) return setError('Address must be at least 5 characters.')
    if (categories.length === 0) return setError('Select at least one category.')

    setSaving(true)
    try {
      const res = await fetch(`/api/locations/${locationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, address, category: categories, vibes, priceLevel, imageUrl, university }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update')
      setEditing(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/locations/${locationId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      router.push('/locations')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setDeleting(false)
      setSaving(false)
    }
  }

  // Delete confirmation modal
  if (deleting) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
        <h3 className="text-red-800 font-bold text-lg mb-2">Delete this post?</h3>
        <p className="text-red-700 text-sm mb-4">
          This will permanently delete this location and all its reviews. This action cannot be undone.
        </p>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={handleDelete}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold px-5 py-2 rounded-lg transition-colors text-sm"
          >
            {saving ? 'Deleting...' : 'Yes, Delete'}
          </button>
          <button
            onClick={() => { setDeleting(false); setError('') }}
            disabled={saving}
            className="bg-white border border-gray-300 text-gray-700 font-medium px-5 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // Edit form
  if (editing) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-navy-800 font-bold text-lg mb-4">Edit Post</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">University</label>
            <input
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Categories</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setCategories((prev) =>
                      prev.includes(opt.value)
                        ? prev.filter((c) => c !== opt.value)
                        : [...prev, opt.value]
                    )
                  }
                  className={`px-3 py-1.5 rounded-lg border-2 text-sm font-semibold transition-all ${
                    categories.includes(opt.value)
                      ? 'border-gold-500 bg-gold-50 text-navy-800'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Photo URL</label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Price</label>
            <div className="flex gap-2">
              {PRICE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriceLevel(opt.value)}
                  className={`px-3 py-1.5 rounded-lg border-2 text-sm font-semibold transition-all ${
                    priceLevel === opt.value
                      ? 'border-gold-500 bg-gold-50 text-navy-800'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Vibes</label>
            <div className="flex flex-wrap gap-2">
              {VIBE_OPTIONS.map((vibe) => (
                <button
                  key={vibe}
                  type="button"
                  onClick={() =>
                    setVibes((prev) =>
                      prev.includes(vibe)
                        ? prev.filter((v) => v !== vibe)
                        : [...prev, vibe]
                    )
                  }
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    vibes.includes(vibe)
                      ? 'bg-navy-700 text-white border-navy-700'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-navy-400'
                  }`}
                >
                  {vibe}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3 mt-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gold-500 hover:bg-gold-400 disabled:bg-gray-300 text-navy-900 font-bold px-5 py-2 rounded-lg transition-colors text-sm"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={() => { setEditing(false); setError('') }}
            disabled={saving}
            className="bg-white border border-gray-300 text-gray-700 font-medium px-5 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // Default: show edit/delete buttons
  return (
    <div className="flex gap-3 mb-6">
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit Post
      </button>
      <button
        onClick={() => setDeleting(true)}
        className="flex items-center gap-2 bg-white border border-red-200 rounded-lg px-4 py-2 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete
      </button>
    </div>
  )
}
