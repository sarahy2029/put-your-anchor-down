'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import UniversitySearch from '@/components/UniversitySearch'
import { useUniversity } from '@/context/UniversityContext'

const ROLE_OPTIONS = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'FACULTY', label: 'Faculty' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'ALUMNI', label: 'Alumni' },
  { value: 'OTHER', label: 'Other' },
]

const ROLE_COLORS: Record<string, string> = {
  STUDENT: 'bg-blue-100 text-blue-800',
  FACULTY: 'bg-purple-100 text-purple-800',
  STAFF: 'bg-green-100 text-green-800',
  ALUMNI: 'bg-gold-100 text-gold-800',
  OTHER: 'bg-silver-100 text-silver-700',
}

interface UserProfile {
  id: string
  name: string
  email: string
  bio: string
  role: string
  university: string
  avatarUrl: string
  graduationYear: number | null
  createdAt: string
  _count: { reviews: number; bracketVotes: number }
  postsCount: number
  uniqueUniversities: number
  uniqueCities: number
}

interface ScrapbookEntry {
  type: 'post' | 'review'
  locationId: string
  locationName: string
  category: string
  imageUrl: string
  avgRating: number
  reviewCount: number
  university: string
  userRating?: number
  reviewSnippet?: string
  date: string
}

const CATEGORY_LABELS: Record<string, string> = {
  OUTDOORS: 'Outdoors',
  ATTRACTION: 'Attractions',
  RESTAURANT: 'Restaurants',
  STUDY_SPOT: 'Study Spots',
  CAFE: 'Cafes',
  NIGHTLIFE: 'Nightlife',
  ON_CAMPUS: 'On Campus',
  CAMPUS_SPOT: 'Campus',
}

const CATEGORY_COLORS: Record<string, string> = {
  OUTDOORS: 'bg-green-100 text-green-800',
  ATTRACTION: 'bg-indigo-100 text-indigo-800',
  RESTAURANT: 'bg-amber-100 text-amber-800',
  STUDY_SPOT: 'bg-blue-100 text-blue-800',
  CAFE: 'bg-yellow-100 text-yellow-800',
  NIGHTLIFE: 'bg-purple-100 text-purple-800',
  ON_CAMPUS: 'bg-gold-100 text-gold-800',
  CAMPUS_SPOT: 'bg-gold-100 text-gold-800',
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { selectedUniversity } = useUniversity()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [scrapbook, setScrapbook] = useState<ScrapbookEntry[]>([])
  const [scrapbookLoading, setScrapbookLoading] = useState(true)
  const [scrapbookFilter, setScrapbookFilter] = useState<'all' | 'post' | 'review'>('all')

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editRole, setEditRole] = useState('STUDENT')
  const [editUniversity, setEditUniversity] = useState('')
  const [editAvatarUrl, setEditAvatarUrl] = useState('')
  const [editGradYear, setEditGradYear] = useState<string>('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/profile')
      return
    }
    if (status === 'authenticated') {
      fetchProfile()
      fetchScrapbook()
    }
  }, [status, router])

  async function fetchProfile() {
    try {
      const res = await fetch('/api/profile')
      if (!res.ok) throw new Error('Failed to fetch profile')
      const data = await res.json()
      setProfile(data)
      // Initialize edit fields
      setEditName(data.name)
      setEditBio(data.bio)
      setEditRole(data.role)
      setEditUniversity(data.university)
      setEditAvatarUrl(data.avatarUrl)
      setEditGradYear(data.graduationYear ? String(data.graduationYear) : '')
    } catch {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  async function fetchScrapbook() {
    try {
      const res = await fetch('/api/profile/scrapbook')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setScrapbook(data)
    } catch {
      setScrapbook([])
    } finally {
      setScrapbookLoading(false)
    }
  }

  async function handleSave() {
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          bio: editBio,
          role: editRole,
          university: editUniversity,
          avatarUrl: editAvatarUrl,
          graduationYear: editGradYear ? parseInt(editGradYear) : null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }

      const updated = await res.json()
      setProfile(updated)
      setEditing(false)
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }

      const { url } = await res.json()
      setEditAvatarUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  function startEditing() {
    if (profile) {
      setEditName(profile.name)
      setEditBio(profile.bio)
      setEditRole(profile.role)
      setEditUniversity(profile.university || selectedUniversity?.name || '')
      setEditAvatarUrl(profile.avatarUrl)
      setEditGradYear(profile.graduationYear ? String(profile.graduationYear) : '')
    }
    setEditing(true)
    setError('')
    setSuccess('')
  }

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-silver-200 rounded-full" />
            <div className="space-y-3 flex-1">
              <div className="h-6 bg-silver-200 rounded w-1/3" />
              <div className="h-4 bg-silver-200 rounded w-1/2" />
            </div>
          </div>
          <div className="h-40 bg-silver-200 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600">{error || 'Could not load profile'}</p>
      </div>
    )
  }

  const initials = profile.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const roleLabel = ROLE_OPTIONS.find(r => r.value === profile.role)?.label || profile.role
  const roleColor = ROLE_COLORS[profile.role] || ROLE_COLORS.OTHER

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-navy-800">My Profile</h1>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-green-700 text-sm font-medium">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {!editing ? (
        /* ===== VIEW MODE ===== */
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-md border border-silver-200 overflow-hidden">
            {/* Banner */}
            <div className="h-32 bg-gradient-to-r from-navy-800 to-navy-600 relative">
              <div className="absolute -bottom-12 left-6">
                {profile.avatarUrl ? (
                  <div className="relative w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                    <Image src={profile.avatarUrl} alt={profile.name} fill className="object-cover" sizes="96px" />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gold-500 flex items-center justify-center">
                    <span className="text-2xl font-black text-navy-900">{initials}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-16 px-6 pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-black text-navy-800">{profile.name}</h2>
                  <p className="text-silver-500 text-sm">{profile.email}</p>
                </div>
                <button
                  onClick={startEditing}
                  className="bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold px-5 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </button>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${roleColor}`}>
                  {roleLabel}
                </span>
                {profile.university && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-navy-50 text-navy-700 border border-navy-200">
                    {profile.university}
                  </span>
                )}
                {profile.graduationYear && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-silver-100 text-silver-700">
                    Class of {profile.graduationYear}
                  </span>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="mt-4 text-silver-600 leading-relaxed">{profile.bio}</p>
              )}
              {!profile.bio && (
                <p className="mt-4 text-silver-400 italic text-sm">No bio yet. Click Edit Profile to add one.</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-silver-200 p-5 text-center">
              <div className="text-2xl font-black text-gold-500">{profile._count.reviews}</div>
              <div className="text-sm text-silver-500 mt-1">Reviews</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-silver-200 p-5 text-center">
              <div className="text-2xl font-black text-gold-500">{profile.postsCount}</div>
              <div className="text-sm text-silver-500 mt-1">Posts</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-silver-200 p-5 text-center">
              <div className="text-2xl font-black text-gold-500">{profile._count.bracketVotes}</div>
              <div className="text-sm text-silver-500 mt-1">Bracket Votes</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-silver-200 p-5 text-center">
              <div className="text-2xl font-black text-gold-500">{profile.uniqueUniversities}</div>
              <div className="text-sm text-silver-500 mt-1">{profile.uniqueUniversities === 1 ? 'College' : 'Colleges'}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-silver-200 p-5 text-center">
              <div className="text-2xl font-black text-gold-500">{profile.uniqueCities}</div>
              <div className="text-sm text-silver-500 mt-1">{profile.uniqueCities === 1 ? 'City' : 'Cities'}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-silver-200 p-5 text-center">
              <div className="text-2xl font-black text-gold-500">{memberSince.split(' ')[0]}</div>
              <div className="text-sm text-silver-500 mt-1">Joined {memberSince.split(' ')[1]}</div>
            </div>
          </div>

          {/* Scrapbook */}
          <div className="bg-white rounded-2xl shadow-md border border-silver-200 overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-navy-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Scrapbook
                </h2>
                <div className="flex gap-1">
                  {(['all', 'post', 'review'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setScrapbookFilter(f)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        scrapbookFilter === f
                          ? 'bg-gold-500 text-navy-900'
                          : 'bg-silver-50 text-silver-600 hover:bg-silver-100'
                      }`}
                    >
                      {f === 'all' ? 'All' : f === 'post' ? 'My Posts' : 'My Reviews'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {scrapbookLoading ? (
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="animate-pulse bg-silver-100 rounded-xl h-32" />
                  ))}
                </div>
              </div>
            ) : scrapbook.filter(e => scrapbookFilter === 'all' || e.type === scrapbookFilter).length === 0 ? (
              <div className="px-6 pb-8 text-center">
                <p className="text-silver-400 text-sm italic">
                  {scrapbookFilter === 'all'
                    ? 'No posts or reviews yet. Start exploring!'
                    : scrapbookFilter === 'post'
                    ? 'No posts yet. Create your first one!'
                    : 'No reviews yet. Share your thoughts on a location!'}
                </p>
              </div>
            ) : (
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {scrapbook
                    .filter(e => scrapbookFilter === 'all' || e.type === scrapbookFilter)
                    .map((entry, idx) => {
                      const primaryCat = (() => {
                        try {
                          const parsed = JSON.parse(entry.category)
                          return Array.isArray(parsed) ? parsed[0] : entry.category
                        } catch {
                          return entry.category
                        }
                      })()
                      const catLabel = CATEGORY_LABELS[primaryCat] || primaryCat
                      const catColor = CATEGORY_COLORS[primaryCat] || 'bg-silver-100 text-silver-700'
                      const dateStr = new Date(entry.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })

                      return (
                        <Link
                          key={`${entry.type}-${entry.locationId}-${idx}`}
                          href={`/locations/${entry.locationId}`}
                          className="group flex gap-3 p-3 rounded-xl border border-silver-200 hover:border-gold-300 hover:shadow-md transition-all bg-white"
                        >
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-silver-100">
                            <Image
                              src={entry.imageUrl}
                              alt={entry.locationName}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                              sizes="80px"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-bold text-sm text-navy-800 truncate group-hover:text-gold-600 transition-colors">
                                {entry.locationName}
                              </h3>
                              <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                entry.type === 'post'
                                  ? 'bg-gold-100 text-gold-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {entry.type === 'post' ? 'Posted' : 'Reviewed'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${catColor}`}>
                                {catLabel}
                              </span>
                              {entry.university && (
                                <span className="text-[10px] text-silver-400 truncate">{entry.university}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 text-xs text-silver-500">
                              <span className="flex items-center gap-0.5">
                                <span className="text-yellow-500">&#9733;</span>
                                {entry.type === 'review' && entry.userRating != null
                                  ? entry.userRating.toFixed(1)
                                  : entry.avgRating.toFixed(1)}
                              </span>
                              <span>·</span>
                              <span>{dateStr}</span>
                            </div>
                            {entry.type === 'review' && entry.reviewSnippet && (
                              <p className="text-xs text-silver-500 mt-1 line-clamp-1 italic">
                                &ldquo;{entry.reviewSnippet}&rdquo;
                              </p>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ===== EDIT MODE ===== */
        <div className="space-y-6">
          {/* Avatar & Name */}
          <div className="bg-white rounded-2xl shadow-md border border-silver-200 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-navy-800 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Basic Info
            </h2>

            <div className="space-y-5">
              {/* Avatar Preview + Upload/URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Photo</label>
                <div className="flex items-center gap-4">
                  {editAvatarUrl ? (
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-silver-200 bg-white flex-shrink-0">
                      <Image src={editAvatarUrl} alt="Preview" fill className="object-cover" sizes="64px" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-black text-navy-900">{initials}</span>
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="inline-flex items-center gap-2 bg-navy-800 hover:bg-navy-700 text-white font-semibold px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors">
                        {uploading ? (
                          <>
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Upload File
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleAvatarUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                      {editAvatarUrl && (
                        <button
                          type="button"
                          onClick={() => setEditAvatarUrl('')}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Remove photo
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>or</span>
                    </div>
                    <input
                      type="url"
                      value={editAvatarUrl.startsWith('http') && !uploading ? editAvatarUrl : ''}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      placeholder="Paste image URL (https://...)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition"
                    />
                    <p className="text-xs text-gray-400">Upload a file or paste an image URL. Max 5MB for uploads.</p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                />
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="bio" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  placeholder="Tell others about yourself..."
                  rows={3}
                  maxLength={500}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent resize-none"
                />
                <p className="mt-1 text-xs text-gray-400">{editBio.length}/500 characters</p>
              </div>
            </div>
          </div>

          {/* Affiliation */}
          <div className="bg-white rounded-2xl shadow-md border border-silver-200 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-navy-800 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Affiliation
            </h2>

            <div className="space-y-5">
              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">I am a...</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {ROLE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEditRole(opt.value)}
                      className={`px-3 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${
                        editRole === opt.value
                          ? 'border-gold-500 bg-gold-50 text-navy-800'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* University */}
              <div>
                <label htmlFor="university" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  University
                </label>
                <input
                  id="university"
                  type="text"
                  value={editUniversity}
                  onChange={e => setEditUniversity(e.target.value)}
                  placeholder="e.g. University of Virginia"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                />
              </div>

              {/* Graduation Year */}
              {(editRole === 'STUDENT' || editRole === 'ALUMNI') && (
                <div>
                  <label htmlFor="gradYear" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {editRole === 'ALUMNI' ? 'Graduation Year' : 'Expected Graduation Year'}
                  </label>
                  <input
                    id="gradYear"
                    type="number"
                    value={editGradYear}
                    onChange={e => setEditGradYear(e.target.value)}
                    placeholder="e.g. 2026"
                    min={2000}
                    max={2040}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !editName.trim()}
              className="bg-gold-500 hover:bg-gold-400 disabled:bg-gray-300 disabled:cursor-not-allowed text-navy-900 font-bold px-8 py-3 rounded-lg transition-colors flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
