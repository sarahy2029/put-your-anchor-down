import Link from 'next/link'
import Image from 'next/image'
import StarRating from './StarRating'

interface LocationCardProps {
  id: string
  name: string
  category: string
  categories?: string[]
  description: string
  address: string
  imageUrl: string
  vibes: string[]
  priceLevel: string
  avgRating: number
  reviewCount: number
  avgWaitMinutes: number
}

const categoryConfig: Record<
  string,
  { label: string; bgColor: string; textColor: string }
> = {
  OUTDOORS: { label: 'Outdoors', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  ATTRACTION: { label: 'Attractions', bgColor: 'bg-silver-200', textColor: 'text-navy-800' },
  RESTAURANT: { label: 'Restaurants', bgColor: 'bg-gold-200', textColor: 'text-gold-900' },
  STUDY_SPOT: { label: 'Study Spots', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
  CAFE: { label: 'Cafes', bgColor: 'bg-amber-100', textColor: 'text-amber-800' },
  NIGHTLIFE: { label: 'Nightlife', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
  ON_CAMPUS: { label: 'On Campus', bgColor: 'bg-gold-100', textColor: 'text-gold-800' },
  CAMPUS_SPOT: { label: 'Campus Spot', bgColor: 'bg-gold-100', textColor: 'text-gold-800' },
}

const priceLevelMap: Record<string, string> = {
  FREE: 'Free',
  DOLLAR: '$',
  TWO_DOLLAR: '$$',
  THREE_DOLLAR: '$$$',
}

export default function LocationCard({
  id,
  name,
  category,
  categories,
  description,
  address,
  imageUrl,
  vibes,
  priceLevel,
  avgRating,
  reviewCount,
  avgWaitMinutes,
}: LocationCardProps) {
  // Parse categories: support both JSON array and single string
  let parsedCategories: string[] = []
  if (categories && categories.length > 0) {
    parsedCategories = categories
  } else {
    try {
      parsedCategories = JSON.parse(category)
    } catch {
      parsedCategories = [category]
    }
  }

  return (
    <Link href={`/locations/${id}`}>
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group h-full flex flex-col border border-gray-100 hover:border-gold-300 hover:-translate-y-1">
        {/* Image */}
        <div className="relative h-48 overflow-hidden flex-shrink-0">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {parsedCategories.slice(0, 2).map((cat) => {
              const config = categoryConfig[cat] || { label: cat, bgColor: 'bg-gray-100', textColor: 'text-gray-800' }
              return (
                <span
                  key={cat}
                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor}`}
                >
                  {config.label}
                </span>
              )
            })}
            {parsedCategories.length > 2 && (
              <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-white/90 text-navy-800">
                +{parsedCategories.length - 2}
              </span>
            )}
          </div>
          <div className="absolute top-3 right-3">
            <span className="bg-white/90 backdrop-blur-sm text-navy-800 px-2.5 py-1 rounded-full text-xs font-bold">
              {priceLevelMap[priceLevel] || priceLevel}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-navy-800 font-bold text-lg mb-1 group-hover:text-navy-600 transition-colors line-clamp-1">
            {name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-2">
            <StarRating rating={avgRating} size="sm" />
            <span className="text-sm font-semibold text-gray-700">
              {avgRating > 0 ? avgRating.toFixed(1) : 'No ratings'}
            </span>
            {reviewCount > 0 && (
              <span className="text-sm text-gray-500">({reviewCount})</span>
            )}
          </div>

          {/* Address */}
          <p className="text-gray-500 text-sm mb-3 flex items-start gap-1">
            <svg
              className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="line-clamp-1">{address}</span>
          </p>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-grow">
            {description}
          </p>

          {/* Vibes */}
          {vibes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-auto">
              {vibes.slice(0, 3).map((vibe) => (
                <span
                  key={vibe}
                  className="bg-navy-50 text-navy-700 px-2 py-0.5 rounded-full text-xs font-medium border border-navy-200"
                >
                  {vibe}
                </span>
              ))}
              {vibes.length > 3 && (
                <span className="text-gray-400 text-xs self-center">
                  +{vibes.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Wait time */}
          {avgWaitMinutes > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1 text-xs text-gray-500">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              ~{Math.round(avgWaitMinutes)} min wait
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
