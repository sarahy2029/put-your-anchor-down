'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import StarRating from '@/components/StarRating'

const CATEGORY_OPTIONS = [
  { value: 'OUTDOORS', label: 'Outdoors', emoji: '🌿' },
  { value: 'ATTRACTION', label: 'Attractions', emoji: '🎯' },
  { value: 'RESTAURANT', label: 'Restaurants', emoji: '🍽️' },
  { value: 'STUDY_SPOT', label: 'Study Spots', emoji: '📚' },
  { value: 'CAFE', label: 'Cafes', emoji: '☕' },
  { value: 'NIGHTLIFE', label: 'Nightlife', emoji: '🌙' },
  { value: 'ON_CAMPUS', label: 'On Campus', emoji: '🏛️' },
]

const PRICE_OPTIONS = [
  { value: 'FREE', label: 'Free' },
  { value: 'DOLLAR', label: '$ — Budget friendly' },
  { value: 'TWO_DOLLAR', label: '$$ — Moderate' },
  { value: 'THREE_DOLLAR', label: '$$$ — Pricey' },
]

const VIBE_OPTIONS = [
  'Chill',
  'Lively',
  'Study-Friendly',
  'Social',
  'Romantic',
  'Adventurous',
  'Outdoorsy',
  'Late-Night',
  'Family-Friendly',
  'Hidden Gem',
]

const WAIT_PRESETS = [
  { value: 0, label: 'No wait' },
  { value: 5, label: '~5 min' },
  { value: 10, label: '~10 min' },
  { value: 15, label: '~15 min' },
  { value: 20, label: '~20 min' },
  { value: 30, label: '~30 min' },
  { value: 45, label: '~45 min' },
  { value: 60, label: '60+ min' },
]

export default function CreatePostPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [university, setUniversity] = useState('')
  const [universities, setUniversities] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [vibes, setVibes] = useState<string[]>([])
  const [priceLevel, setPriceLevel] = useState('')
  const [waitMinutes, setWaitMinutes] = useState(0)
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([])
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false)
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const addressContainerRef = useRef<HTMLDivElement>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [photoMode, setPhotoMode] = useState<'upload' | 'url'>('upload')
  const [rating, setRating] = useState(0)
  const [reviewBody, setReviewBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Fetch universities for suggestions
  useEffect(() => {
    fetch('/api/universities')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setUniversities(data) })
      .catch(() => {})
  }, [])

  // Close address dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (addressContainerRef.current && !addressContainerRef.current.contains(e.target as Node)) {
        setShowAddressSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchAddressSuggestions = useCallback((query: string) => {
    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current)
    if (query.trim().length < 3) {
      setAddressSuggestions([])
      setShowAddressSuggestions(false)
      return
    }
    addressDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`,
          { headers: { 'User-Agent': 'PutYourAnchorDown/1.0' } }
        )
        const data: Array<{ display_name: string }> = await res.json()
        setAddressSuggestions(data.map((r) => r.display_name))
        setShowAddressSuggestions(data.length > 0)
      } catch {
        setAddressSuggestions([])
      }
    }, 350)
  }, [])

  if (status === 'loading') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl shadow-lg p-10 border border-gray-100">
          <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-navy-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-navy-800 mb-3">Sign In Required</h2>
          <p className="text-gray-500 mb-6">
            You need a .edu email account to create posts and share your favorite spots with fellow students.
          </p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold px-8 py-3 rounded-lg transition-colors"
          >
            Sign In with .edu Email
          </button>
        </div>
      </div>
    )
  }

  function toggleVibe(vibe: string) {
    setVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) return setError('Please enter a location name.')
    if (!address.trim()) return setError('Please enter an address.')
    if (!university.trim()) return setError('Please enter a university.')
    if (categories.length === 0) return setError('Please select at least one category.')
    if (!description.trim() || description.trim().length < 10)
      return setError('Description must be at least 10 characters.')
    if (!priceLevel) return setError('Please select a price range.')
    if (rating === 0) return setError('Please give a star rating.')
    if (!reviewBody.trim() || reviewBody.trim().length < 10)
      return setError('Your review must be at least 10 characters.')

    setSubmitting(true)

    try {
      let uploadedImageUrl = imageUrl.trim()

      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)
        const uploadRes = await fetch('/api/upload/location', {
          method: 'POST',
          body: formData,
        })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) {
          setError(uploadData.error || 'Failed to upload image.')
          setSubmitting(false)
          return
        }
        uploadedImageUrl = uploadData.url
      }

      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim(),
          university: university.trim(),
          category: categories,
          description: description.trim(),
          vibes,
          priceLevel,
          waitMinutes,
          imageUrl: uploadedImageUrl,
          rating,
          reviewBody: reviewBody.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        setSubmitting(false)
        return
      }

      router.push(`/locations/${data.id}`)
    } catch {
      setError('Failed to create post. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-navy-800 mb-2">Create a Post</h1>
        <p className="text-gray-500">
          Share a campus spot, restaurant, or nearby attraction with fellow students.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Location Details Section */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-navy-800 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Location Details
          </h2>

          <div className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Location Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. The Corner Cafe, Clark Library, Blue Ridge Trail"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition"
              />
            </div>

            {/* Address */}
            <div ref={addressContainerRef} className="relative">
              <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value)
                  fetchAddressSuggestions(e.target.value)
                }}
                onFocus={() => {
                  if (addressSuggestions.length > 0) setShowAddressSuggestions(true)
                }}
                placeholder="e.g. 123 University Ave, Charlottesville, VA"
                autoComplete="off"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition"
              />
              {showAddressSuggestions && addressSuggestions.length > 0 && (
                <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {addressSuggestions.map((suggestion, i) => (
                    <li
                      key={i}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setAddress(suggestion)
                        setShowAddressSuggestions(false)
                        setAddressSuggestions([])
                      }}
                      className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gold-50 hover:text-navy-800 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* University */}
            <div>
              <label htmlFor="university" className="block text-sm font-semibold text-gray-700 mb-1.5">
                University <span className="text-red-500">*</span>
              </label>
              <input
                id="university"
                type="text"
                list="university-list"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="e.g. University of Virginia, Duke University"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition"
              />
              <datalist id="university-list">
                {universities.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
              <p className="mt-1 text-xs text-gray-400">
                Type to search or enter a new university name
              </p>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Categories <span className="text-red-500">*</span>
                <span className="font-normal text-gray-400 ml-1">(select all that apply)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                    className={`px-3 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${
                      categories.includes(opt.value)
                        ? 'border-gold-500 bg-gold-50 text-navy-800'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {opt.emoji} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell others what makes this place special. What should they know before visiting?"
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition resize-none"
              />
              <p className="mt-1 text-xs text-gray-400">
                {description.length}/500 characters (min 10)
              </p>
            </div>

            {/* Photo Upload / URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Photo
                <span className="font-normal text-gray-400 ml-1">(optional)</span>
              </label>

              {/* Toggle tabs */}
              <div className="flex rounded-lg border border-gray-300 overflow-hidden mb-3 w-fit">
                <button
                  type="button"
                  onClick={() => { setPhotoMode('upload'); setImageUrl('') }}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                    photoMode === 'upload'
                      ? 'bg-navy-800 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => { setPhotoMode('url'); setImageFile(null); setImagePreview('') }}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                    photoMode === 'url'
                      ? 'bg-navy-800 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Paste URL
                </button>
              </div>

              {photoMode === 'upload' ? (
                <>
                  <label
                    htmlFor="imageFile"
                    className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-6 cursor-pointer hover:border-gold-400 transition-colors bg-gray-50 hover:bg-gold-50"
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-40 rounded-lg object-cover mb-2"
                      />
                    ) : (
                      <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                    <span className="text-sm text-gray-500">
                      {imageFile ? imageFile.name : 'Click to upload a photo'}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP, or GIF · Max 5MB</span>
                    <input
                      id="imageFile"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null
                        setImageFile(file)
                        if (file) {
                          setImagePreview(URL.createObjectURL(file))
                        } else {
                          setImagePreview('')
                        }
                      }}
                    />
                  </label>
                  {imageFile && (
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview('') }}
                      className="mt-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove photo
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition"
                  />
                  {imageUrl.trim() && (
                    <img
                      src={imageUrl.trim()}
                      alt="Preview"
                      className="max-h-40 rounded-lg object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      onLoad={(e) => { (e.target as HTMLImageElement).style.display = 'block' }}
                    />
                  )}
                </div>
              )}

              <p className="mt-1 text-xs text-gray-400">
                A default image will be used if left empty.
              </p>
            </div>
          </div>
        </div>

        {/* Tags & Attributes Section */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-navy-800 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Tags &amp; Attributes
          </h2>

          <div className="space-y-5">
            {/* Vibes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Vibes
                <span className="font-normal text-gray-400 ml-1">(select all that apply)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {VIBE_OPTIONS.map((vibe) => (
                  <button
                    key={vibe}
                    type="button"
                    onClick={() => toggleVibe(vibe)}
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

            {/* Price Range */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Price Range <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRICE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriceLevel(opt.value)}
                    className={`px-3 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${
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

            {/* Wait Time */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Typical Wait Time
              </label>
              <div className="flex flex-wrap gap-2">
                {WAIT_PRESETS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setWaitMinutes(opt.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      waitMinutes === opt.value
                        ? 'bg-navy-700 text-white border-navy-700'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-navy-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Your Review Section */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-navy-800 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Your Review
          </h2>

          <div className="space-y-5">
            {/* Star Rating */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <StarRating rating={rating} size="lg" interactive onRate={setRating} />
                {rating > 0 && (
                  <span className="text-sm text-gray-500 font-medium">
                    {rating} / 5
                  </span>
                )}
              </div>
            </div>

            {/* Review Body */}
            <div>
              <label htmlFor="reviewBody" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Your Review <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reviewBody"
                value={reviewBody}
                onChange={(e) => setReviewBody(e.target.value)}
                placeholder="Share your experience! What did you like? What should others know?"
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition resize-none"
              />
              <p className="mt-1 text-xs text-gray-400">
                {reviewBody.length}/1000 characters (min 10)
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-gold-500 hover:bg-gold-400 disabled:bg-gray-300 disabled:cursor-not-allowed text-navy-900 font-bold px-8 py-3 rounded-lg transition-colors flex items-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating...
              </>
            ) : (
              'Create Post'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
