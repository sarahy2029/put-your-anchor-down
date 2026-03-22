'use client'

import { useState } from 'react'
import StarRating from './StarRating'

interface ReviewFormProps {
  locationId: string
  onReviewSubmitted: () => void
}

const VIBES = [
  'Chill',
  'Lively',
  'Study-Friendly',
  'Social',
  'Romantic',
  'Adventurous',
  'Outdoorsy',
]

export default function ReviewForm({ locationId, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [waitMinutes, setWaitMinutes] = useState('')
  const [selectedVibes, setSelectedVibes] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const handleVibeToggle = (vibe: string) => {
    setSelectedVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (rating === 0) {
      setError('Please select a star rating.')
      return
    }

    if (body.trim().length < 10) {
      setError('Review must be at least 10 characters long.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId,
          rating,
          body: body.trim(),
          waitMinutes: waitMinutes ? parseInt(waitMinutes) : 0,
          vibes: selectedVibes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review')
      }

      setSuccess(true)
      setRating(0)
      setBody('')
      setWaitMinutes('')
      setSelectedVibes([])
      onReviewSubmitted()

      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <h3 className="text-navy-800 font-bold text-xl mb-5">Write a Review</h3>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-5 flex items-center gap-3">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-green-800 font-medium">Review submitted successfully!</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-5 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <StarRating rating={rating} size="lg" interactive onRate={setRating} />
            {rating > 0 && (
              <span className="text-sm font-medium text-gray-600">
                {rating} / 5
              </span>
            )}
          </div>
        </div>

        {/* Review Body */}
        <div>
          <label
            htmlFor="review-body"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Your Review <span className="text-red-500">*</span>
          </label>
          <textarea
            id="review-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Share your experience — what made it great or not so great?"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent resize-none transition-shadow"
            required
          />
          <p className="text-xs text-gray-400 mt-1">{body.length} characters</p>
        </div>

        {/* Wait Time */}
        <div>
          <label
            htmlFor="wait-time"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Wait Time (minutes)
          </label>
          <input
            id="wait-time"
            type="number"
            min="0"
            max="120"
            value={waitMinutes}
            onChange={(e) => setWaitMinutes(e.target.value)}
            placeholder="e.g. 10"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-shadow"
          />
        </div>

        {/* Vibes */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Vibes
          </label>
          <div className="flex flex-wrap gap-2">
            {VIBES.map((vibe) => (
              <button
                key={vibe}
                type="button"
                onClick={() => handleVibeToggle(vibe)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedVibes.includes(vibe)
                    ? 'bg-navy-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {vibe}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gold-500 hover:bg-gold-400 disabled:bg-gray-300 text-navy-900 disabled:text-gray-500 font-bold py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting...
            </>
          ) : (
            'Submit Review'
          )}
        </button>
      </form>
    </div>
  )
}
