'use client'

import { useUniversity } from '@/context/UniversityContext'

interface UniversitySearchProps {
  size?: 'sm' | 'lg'
  showClear?: boolean
}

export default function UniversitySearch({ size = 'sm', showClear = false }: UniversitySearchProps) {
  const {
    selectedUniversity,
    universityInput,
    suggestions,
    showSuggestions,
    searchingUnis,
    setUniversityInput,
    setShowSuggestions,
    selectUniversity,
    clearUniversity,
  } = useUniversity()

  const isLarge = size === 'lg'

  return (
    <div className={`relative ${isLarge ? 'w-full max-w-lg' : 'w-full max-w-sm'}`}>
      <div className="relative">
        <svg
          className={`absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 ${isLarge ? 'w-5 h-5 left-4' : 'w-4 h-4'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={universityInput}
          onChange={e => {
            setUniversityInput(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Search for a university..."
          className={`w-full border-2 border-silver-200 rounded-xl text-navy-800 placeholder-silver-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-all shadow-sm bg-white ${
            isLarge ? 'pl-12 pr-10 py-4 text-lg' : 'pl-9 pr-4 py-2 text-sm font-semibold'
          }`}
        />
        {searchingUnis && (
          <svg className={`absolute top-1/2 -translate-y-1/2 animate-spin text-gold-500 ${isLarge ? 'right-4 w-5 h-5' : 'right-3 w-4 h-4'}`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {showClear && selectedUniversity && !searchingUnis && (
          <button
            onClick={clearUniversity}
            className={`absolute top-1/2 -translate-y-1/2 text-silver-400 hover:text-navy-700 transition-colors ${isLarge ? 'right-4' : 'right-3'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-silver-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={`${s.name}-${i}`}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => selectUniversity(s)}
              className="w-full text-left px-4 py-2.5 hover:bg-gold-50 transition-colors flex items-center gap-2 border-b border-silver-50 last:border-0"
            >
              <svg className="w-4 h-4 text-gold-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className={`font-medium text-navy-800 truncate ${isLarge ? 'text-base' : 'text-sm'}`}>{s.name}</span>
              {s.source === 'local' && (
                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold flex-shrink-0">HAS LOCATIONS</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
