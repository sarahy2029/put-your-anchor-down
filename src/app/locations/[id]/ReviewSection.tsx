'use client'

import { useState } from 'react'
import Link from 'next/link'
import ReviewForm from '@/components/ReviewForm'
import StarRating from '@/components/StarRating'

interface Review {
  id: string
  rating: number
  body: string
  waitMinutes: number
  vibes: string[]
  createdAt: string | Date
  user: {
    id: string
    name: string
    email: string
  }
}

interface ReviewSectionProps {
  locationId: string
  initialReviews: Review[]
  isEduUser: boolean
  currentUserId?: string | null
}

const VIBES = [
  'Chill', 'Lively', 'Study-Friendly', 'Social',
  'Romantic', 'Adventurous', 'Outdoorsy',
]

function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const masked =
    local.length > 2
      ? local[0] + '•'.repeat(local.length - 2) + local[local.length - 1]
      : local
  return `${masked}@${domain}`
}

export default function ReviewSection({
  locationId,
  initialReviews,
  isEduUser,
  currentUserId,
}: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [refreshing, setRefreshing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRating, setEditRating] = useState(0)
  const [editBody, setEditBody] = useState('')
  const [editWait, setEditWait] = useState('')
  const [editVibes, setEditVibes] = useState<string[]>([])
  const [editError, setEditError] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const refreshReviews = async () => {
    setRefreshing(true)
    try {
      const res = await fetch(`/api/reviews?locationId=${locationId}`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data)
      }
    } catch {
      // silently fail
    } finally {
      setRefreshing(false)
    }
  }

  const startEditing = (review: Review) => {
    setEditingId(review.id)
    setEditRating(review.rating)
    setEditBody(review.body)
    setEditWait(review.waitMinutes > 0 ? String(review.waitMinutes) : '')
    setEditVibes(review.vibes)
    setEditError('')
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditError('')
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditError('')

    if (editRating === 0) return setEditError('Please select a rating.')
    if (editBody.trim().length < 10) return setEditError('Review must be at least 10 characters.')

    setEditSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: editingId,
          rating: editRating,
          body: editBody.trim(),
          waitMinutes: editWait ? parseInt(editWait) : 0,
          vibes: editVibes,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update review')
      }
      setEditingId(null)
      await refreshReviews()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return

    setDeletingId(reviewId)
    try {
      const res = await fetch(`/api/reviews?reviewId=${reviewId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to delete review')
        return
      }
      await refreshReviews()
    } catch {
      alert('Failed to delete review')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Review Form */}
      {isEduUser && (
        <ReviewForm
          locationId={locationId}
          onReviewSubmitted={refreshReviews}
        />
      )}

      {/* Reviews List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-navy-800 font-bold text-xl">
              Reviews
              <span className="text-gray-400 font-normal text-lg ml-2">
                ({reviews.length})
              </span>
            </h2>
            {refreshing && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Refreshing...
              </div>
            )}
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-5xl mb-3">💬</div>
            <h3 className="text-navy-800 font-bold text-lg mb-1">
              No reviews yet
            </h3>
            <p className="text-gray-500 text-sm">
              {isEduUser
                ? 'Be the first to share your experience!'
                : 'Sign in with your .edu email to be the first to review.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reviews.map((review) => {
              const isOwner = currentUserId === review.user.id
              const isEditing = editingId === review.id
              const isDeleting = deletingId === review.id

              return (
                <div key={review.id} className="p-6">
                  {isEditing ? (
                    /* Edit Form */
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-navy-800">Edit Review</h4>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>

                      {editError && (
                        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{editError}</p>
                      )}

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Rating</label>
                        <StarRating rating={editRating} size="lg" interactive onRate={setEditRating} />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Review</label>
                        <textarea
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          rows={3}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Wait Time (min)</label>
                        <input
                          type="number"
                          min="0"
                          max="120"
                          value={editWait}
                          onChange={(e) => setEditWait(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Vibes</label>
                        <div className="flex flex-wrap gap-2">
                          {VIBES.map((vibe) => (
                            <button
                              key={vibe}
                              type="button"
                              onClick={() =>
                                setEditVibes((prev) =>
                                  prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
                                )
                              }
                              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                editVibes.includes(vibe)
                                  ? 'bg-navy-800 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {vibe}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={editSubmitting}
                        className="bg-gold-500 hover:bg-gold-400 disabled:bg-gray-300 text-navy-900 font-bold px-6 py-2.5 rounded-lg transition-colors text-sm"
                      >
                        {editSubmitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </form>
                  ) : (
                    /* Normal Review Display */
                    <>
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <Link href={`/profile/${review.user.id}`} className="flex items-center gap-3 group">
                          <div className="w-9 h-9 bg-navy-800 group-hover:bg-gold-500 rounded-full flex items-center justify-center flex-shrink-0 transition-colors">
                            <span className="text-white group-hover:text-navy-900 font-bold text-sm transition-colors">
                              {review.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-navy-800 text-sm group-hover:text-gold-600 transition-colors">
                              {review.user.name}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {maskEmail(review.user.email)}
                            </p>
                          </div>
                        </Link>
                        <div className="text-right flex-shrink-0">
                          <StarRating rating={review.rating} size="sm" />
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(review.createdAt)}
                          </p>
                        </div>
                      </div>

                      <p className="text-gray-700 leading-relaxed mb-3">{review.body}</p>

                      <div className="flex flex-wrap items-center gap-3">
                        {review.waitMinutes > 0 && (
                          <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {review.waitMinutes} min wait
                          </span>
                        )}
                        {review.vibes.map((vibe) => (
                          <span
                            key={vibe}
                            className="text-xs bg-navy-50 text-navy-700 border border-navy-200 px-2.5 py-1 rounded-full"
                          >
                            {vibe}
                          </span>
                        ))}
                      </div>

                      {/* Edit/Delete buttons for review owner */}
                      {isOwner && (
                        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => startEditing(review)}
                            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-700 font-medium transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(review.id)}
                            disabled={isDeleting}
                            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 font-medium transition-colors disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
