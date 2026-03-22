'use client'

export interface FilterState {
  category: string
  vibes: string[]
  priceLevel: string
  waitTime: string
}

interface FilterBarProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
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

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const handleCategoryChange = (category: string) => {
    onFilterChange({ ...filters, category })
  }

  const handleVibeToggle = (vibe: string) => {
    const newVibes = filters.vibes.includes(vibe)
      ? filters.vibes.filter((v) => v !== vibe)
      : [...filters.vibes, vibe]
    onFilterChange({ ...filters, vibes: newVibes })
  }

  const handlePriceChange = (priceLevel: string) => {
    onFilterChange({ ...filters, priceLevel })
  }

  const handleWaitTimeChange = (waitTime: string) => {
    onFilterChange({ ...filters, waitTime })
  }

  const handleReset = () => {
    onFilterChange({ category: 'ALL', vibes: [], priceLevel: 'ALL', waitTime: 'ANY' })
  }

  const hasActiveFilters =
    filters.category !== 'ALL' ||
    filters.vibes.length > 0 ||
    filters.priceLevel !== 'ALL' ||
    filters.waitTime !== 'ANY'

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-navy-800 font-bold text-lg">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="text-sm text-gold-600 hover:text-gold-700 font-medium underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Category */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Category
        </h3>
        <div className="flex flex-col gap-2">
          {[
            { value: 'ALL', label: 'All Places' },
            { value: 'OUTDOORS', label: 'Outdoors' },
            { value: 'ATTRACTION', label: 'Attractions' },
            { value: 'RESTAURANT', label: 'Restaurants' },
            { value: 'STUDY_SPOT', label: 'Study Spots' },
            { value: 'CAFE', label: 'Cafes' },
            { value: 'NIGHTLIFE', label: 'Nightlife' },
            { value: 'ON_CAMPUS', label: 'On Campus' },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="category"
                value={value}
                checked={filters.category === value}
                onChange={() => handleCategoryChange(value)}
                className="w-4 h-4 text-gold-500 border-gray-300 focus:ring-gold-400"
              />
              <span className="text-sm text-gray-700 group-hover:text-navy-700 transition-colors">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Vibes */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Vibes
        </h3>
        <div className="flex flex-col gap-2">
          {VIBES.map((vibe) => (
            <label key={vibe} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.vibes.includes(vibe)}
                onChange={() => handleVibeToggle(vibe)}
                className="w-4 h-4 text-gold-500 border-gray-300 rounded focus:ring-gold-400"
              />
              <span className="text-sm text-gray-700 group-hover:text-navy-700 transition-colors">
                {vibe}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Price
        </h3>
        <div className="flex flex-col gap-2">
          {[
            { value: 'ALL', label: 'Any Price' },
            { value: 'FREE', label: 'Free' },
            { value: 'DOLLAR', label: '$ (Budget)' },
            { value: 'TWO_DOLLAR', label: '$$ (Moderate)' },
            { value: 'THREE_DOLLAR', label: '$$$ (Upscale)' },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="priceLevel"
                value={value}
                checked={filters.priceLevel === value}
                onChange={() => handlePriceChange(value)}
                className="w-4 h-4 text-gold-500 border-gray-300 focus:ring-gold-400"
              />
              <span className="text-sm text-gray-700 group-hover:text-navy-700 transition-colors">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Wait Time */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Wait Time
        </h3>
        <div className="flex flex-col gap-2">
          {[
            { value: 'ANY', label: 'Any Wait' },
            { value: 'UNDER_5', label: 'Under 5 min' },
            { value: '5_15', label: '5 – 15 min' },
            { value: '15_30', label: '15 – 30 min' },
            { value: '30_PLUS', label: '30+ min' },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="waitTime"
                value={value}
                checked={filters.waitTime === value}
                onChange={() => handleWaitTimeChange(value)}
                className="w-4 h-4 text-gold-500 border-gray-300 focus:ring-gold-400"
              />
              <span className="text-sm text-gray-700 group-hover:text-navy-700 transition-colors">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
