'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface UniversitySuggestion {
  name: string
  lat: number
  lng: number
  source: 'local' | 'external'
}

interface UniversityContextType {
  selectedUniversity: { name: string; lat: number; lng: number } | null
  universityInput: string
  suggestions: UniversitySuggestion[]
  showSuggestions: boolean
  searchingUnis: boolean
  setUniversityInput: (v: string) => void
  setShowSuggestions: (v: boolean) => void
  selectUniversity: (uni: { name: string; lat: number; lng: number }) => void
  clearUniversity: () => void
}

const UniversityContext = createContext<UniversityContextType | null>(null)

export function UniversityProvider({ children }: { children: ReactNode }) {
  const [selectedUniversity, setSelectedUniversity] = useState<{ name: string; lat: number; lng: number } | null>(null)
  const [universityInput, setUniversityInput] = useState('')
  const [suggestions, setSuggestions] = useState<UniversitySuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchingUnis, setSearchingUnis] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('selectedUniversity')
      if (saved) {
        const parsed = JSON.parse(saved)
        setSelectedUniversity(parsed)
        setUniversityInput(parsed.name)
      }
    } catch {}
  }, [])

  // Debounced university search
  useEffect(() => {
    if (selectedUniversity && universityInput === selectedUniversity.name) return
    if (universityInput.length < 2) { setSuggestions([]); return }
    const timer = setTimeout(async () => {
      setSearchingUnis(true)
      try {
        const res = await fetch(`/api/universities/search?q=${encodeURIComponent(universityInput)}`)
        const data = await res.json()
        setSuggestions(data)
        setShowSuggestions(true)
      } catch { setSuggestions([]) }
      finally { setSearchingUnis(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [universityInput, selectedUniversity])

  const selectUniversity = useCallback((uni: { name: string; lat: number; lng: number }) => {
    setSelectedUniversity(uni)
    setUniversityInput(uni.name)
    setShowSuggestions(false)
    setSuggestions([])
    try {
      localStorage.setItem('selectedUniversity', JSON.stringify(uni))
    } catch {}
  }, [])

  const clearUniversity = useCallback(() => {
    setSelectedUniversity(null)
    setUniversityInput('')
    setSuggestions([])
    setShowSuggestions(false)
    try {
      localStorage.removeItem('selectedUniversity')
    } catch {}
  }, [])

  return (
    <UniversityContext.Provider value={{
      selectedUniversity,
      universityInput,
      suggestions,
      showSuggestions,
      searchingUnis,
      setUniversityInput,
      setShowSuggestions,
      selectUniversity,
      clearUniversity,
    }}>
      {children}
    </UniversityContext.Provider>
  )
}

export function useUniversity() {
  const ctx = useContext(UniversityContext)
  if (!ctx) throw new Error('useUniversity must be used within UniversityProvider')
  return ctx
}
