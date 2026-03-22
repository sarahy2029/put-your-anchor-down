'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import UniversitySearch from '@/components/UniversitySearch'
import { useUniversity } from '@/context/UniversityContext'

interface BracketLocation {
  id: string
  name: string
  imageUrl: string
  avgRating: number
  reviewCount: number
}

interface Vote { id: string; locationId: string; userId: string }

interface Matchup {
  id: string
  round: number
  position: number
  locationA: BracketLocation | null
  locationB: BracketLocation | null
  winner: { id: string; name: string } | null
  votes: Vote[]
}

interface Bracket {
  id: string
  university: string
  month: number
  year: number
  round: number
  finished: boolean
  matchups: Matchup[]
}

const MONTHS = ['','January','February','March','April','May','June','July','August','September','October','November','December']

const ROUND_NAMES: Record<number, Record<number, string>> = {
  4: { 1: 'ROUND OF 16', 2: 'QUARTERFINALS', 3: 'SEMIFINALS', 4: 'FINALS' },
  3: { 1: 'QUARTERFINALS', 2: 'SEMIFINALS', 3: 'FINALS' },
  2: { 1: 'SEMIFINALS', 2: 'FINALS' },
  1: { 1: 'FINALS' },
}

export default function BracketPage() {
  const { data: session } = useSession()
  const { selectedUniversity } = useUniversity()
  const [bracket, setBracket] = useState<Bracket | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [voting, setVoting] = useState<string | null>(null)

  const fetchBracket = useCallback(async () => {
    if (!selectedUniversity) return
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({
        university: selectedUniversity.name,
        lat: String(selectedUniversity.lat),
        lng: String(selectedUniversity.lng),
      })
      const res = await fetch(`/api/brackets?${params}`)
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      setBracket(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
      setBracket(null)
    } finally { setLoading(false) }
  }, [selectedUniversity])

  useEffect(() => { fetchBracket() }, [fetchBracket])

  const handleVote = async (matchupId: string, locationId: string) => {
    if (!bracket || !session?.user?.email) return
    setVoting(matchupId)
    try {
      const res = await fetch(`/api/brackets/${bracket.id}/vote`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchupId, locationId }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      await fetchBracket()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setVoting(null) }
  }

  if (!bracket || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-navy-800 text-white py-8 text-center">
          <h1 className="text-4xl font-black">MONTHLY BRACKET</h1>
          <p className="text-gray-400 text-sm mt-2">Vote for your favorite spots each round</p>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <UniversitySearch showClear />
          {loading && (
            <div className="flex justify-center py-20">
              <svg className="w-8 h-8 animate-spin text-gold-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
          {!loading && !selectedUniversity && (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg font-semibold">Search for your university to get started</p>
              <p className="text-sm mt-1">Type a university name above to see the bracket for nearby locations</p>
            </div>
          )}
          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center mt-4"><p className="text-red-700">{error}</p></div>}
        </div>
      </div>
    )
  }

  const totalRounds = Math.max(...bracket.matchups.map(m => m.round))
  const roundNames = ROUND_NAMES[totalRounds] || {}
  const isActive = (r: number) => r === bracket.round && !bracket.finished
  const canVote = !!session?.user?.email && !bracket.finished

  // How many rounds on each side vs center
  // 4 rounds: 2 side + 2 center (SF, Finals)
  // 3 rounds: 1 side + 2 center (SF, Finals)
  // 2 rounds: 1 side + 0 center (Finals only in center champion area)
  // 1 round: 0 side + 1 center
  const sideRounds = totalRounds <= 1 ? 0 : totalRounds <= 2 ? 1 : totalRounds - 2

  const getHalf = (round: number, side: 'left' | 'right') => {
    const all = bracket.matchups.filter(m => m.round === round).sort((a, b) => a.position - b.position)
    if (all.length <= 1) return side === 'left' ? all : []
    const h = Math.ceil(all.length / 2)
    return side === 'left' ? all.slice(0, h) : all.slice(h)
  }

  // Finals matchup
  const finalMatchup = bracket.matchups.find(m => m.round === totalRounds)
  const champion = bracket.finished && finalMatchup?.winner
    ? { name: finalMatchup.winner.name, loc: finalMatchup.locationA?.id === finalMatchup.winner.id ? finalMatchup.locationA : finalMatchup.locationB }
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-navy-800 text-white py-6 sm:py-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">MONTHLY BRACKET</h1>
        <p className="text-gold-400 font-bold text-lg">{MONTHS[bracket.month]} {bracket.year}</p>
        <p className="text-gray-400 text-sm mt-1">Vote for your favorite spots each round</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <UniversitySearch showClear />
          {!bracket.finished && (
            <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
              Voting Open &middot; {roundNames[bracket.round]}
            </span>
          )}
          {bracket.finished && (
            <span className="bg-gold-100 text-gold-800 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">Complete</span>
          )}
          {!session?.user?.email && (
            <Link href="/auth/signin" className="ml-auto text-sm font-semibold text-gold-600 hover:text-gold-700 underline">Sign in to vote</Link>
          )}
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4"><p className="text-red-700 text-sm">{error}</p></div>}

        {/* Bracket */}
        <div className="overflow-x-auto pb-4">
          <div className="flex items-stretch" style={{ minWidth: `${(sideRounds * 2 + 1) * 200}px`, minHeight: '400px' }}>

            {/* LEFT SIDE columns */}
            {Array.from({ length: sideRounds }, (_, i) => {
              const round = i + 1
              const matchups = getHalf(round, 'left')
              return (
                <RoundCol key={`L${round}`} matchups={matchups} label={roundNames[round]}
                  isActive={isActive(round)} canVote={canVote && isActive(round)}
                  onVote={handleVote} voting={voting} side="left" round={round} />
              )
            })}

            {/* CENTER */}
            <div className="flex-1 flex flex-col items-center justify-center px-2 gap-6 min-w-[200px]">
              {/* Center rounds (SF and Finals for 4-round bracket, just Finals for 3-round, etc.) */}
              {totalRounds >= 3 && Array.from(
                { length: totalRounds - sideRounds * 2 },
                (_, i) => sideRounds + i + 1
              ).map(round => {
                const matchups = bracket.matchups.filter(m => m.round === round).sort((a, b) => a.position - b.position)
                return matchups.map(m => (
                  <div key={m.id} className="w-full max-w-[200px]">
                    <p className={`text-[9px] font-black uppercase tracking-widest text-center mb-1 ${isActive(round) ? 'text-gold-600' : 'text-gray-400'}`}>
                      {roundNames[round]}
                    </p>
                    <MatchupCard matchup={m} isActive={isActive(round)}
                      canVote={canVote && isActive(round)} onVote={handleVote}
                      voting={voting === m.id} highlight />
                  </div>
                ))
              })}

              {/* For 2-round brackets, show the finals in center */}
              {totalRounds === 2 && (() => {
                const finals = bracket.matchups.filter(m => m.round === 2)
                return finals.map(m => (
                  <div key={m.id} className="w-full max-w-[200px]">
                    <p className={`text-[9px] font-black uppercase tracking-widest text-center mb-1 ${isActive(2) ? 'text-gold-600' : 'text-gray-400'}`}>FINALS</p>
                    <MatchupCard matchup={m} isActive={isActive(2)}
                      canVote={canVote && isActive(2)} onVote={handleVote}
                      voting={voting === m.id} highlight />
                  </div>
                ))
              })()}

              {/* For 1-round bracket */}
              {totalRounds === 1 && bracket.matchups.map(m => (
                <div key={m.id} className="w-full max-w-[200px]">
                  <p className={`text-[9px] font-black uppercase tracking-widest text-center mb-1 text-gold-600`}>FINALS</p>
                  <MatchupCard matchup={m} isActive={isActive(1)}
                    canVote={canVote && isActive(1)} onVote={handleVote}
                    voting={voting === m.id} highlight />
                </div>
              ))}

              {/* Champion */}
              {champion && champion.loc && (
                <div className="bg-gradient-to-b from-gold-400 to-gold-600 rounded-xl p-4 text-center shadow-xl w-full max-w-[180px]">
                  <div className="text-3xl mb-1">&#127942;</div>
                  <div className="relative w-12 h-12 rounded-full overflow-hidden mx-auto mb-2 border-2 border-white shadow">
                    <Image src={champion.loc.imageUrl} alt={champion.name} fill className="object-cover" sizes="48px" />
                  </div>
                  <p className="text-navy-900 font-black text-sm">{champion.name}</p>
                  <p className="text-navy-800 text-[9px] mt-0.5 opacity-70 font-bold uppercase">Champion</p>
                </div>
              )}
            </div>

            {/* RIGHT SIDE columns (mirrored order) */}
            {Array.from({ length: sideRounds }, (_, i) => {
              const round = sideRounds - i
              const matchups = getHalf(round, 'right')
              return (
                <RoundCol key={`R${round}`} matchups={matchups} label={roundNames[round]}
                  isActive={isActive(round)} canVote={canVote && isActive(round)}
                  onVote={handleVote} voting={voting} side="right" round={round} />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function RoundCol({ matchups, label, isActive, canVote, onVote, voting, side, round }: {
  matchups: Matchup[]; label: string; isActive: boolean; canVote: boolean
  onVote: (mid: string, lid: string) => void; voting: string | null; side: 'left' | 'right'; round: number
}) {
  return (
    <div className="flex flex-col flex-1 min-w-[160px] max-w-[210px]">
      <p className={`text-[9px] font-black uppercase tracking-widest text-center mb-2 ${isActive ? 'text-gold-600' : 'text-gray-400'}`}>
        {label}
      </p>
      <div className="flex flex-col justify-around flex-1 gap-2 px-1">
        {matchups.map(m => (
          <div key={m.id} className="flex items-center">
            {side === 'right' && (
              <div className={`w-4 border-t-2 flex-shrink-0 ${isActive ? 'border-gold-300' : 'border-gray-200'}`} />
            )}
            <div className="flex-1">
              <MatchupCard matchup={m} isActive={isActive} canVote={canVote}
                onVote={onVote} voting={voting === m.id} />
            </div>
            {side === 'left' && (
              <div className={`w-4 border-t-2 flex-shrink-0 ${isActive ? 'border-gold-300' : 'border-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function MatchupCard({ matchup, isActive, canVote, onVote, voting, highlight = false }: {
  matchup: Matchup; isActive: boolean; canVote: boolean
  onVote: (mid: string, lid: string) => void; voting: boolean; highlight?: boolean
}) {
  const vA = matchup.votes.filter(v => v.locationId === matchup.locationA?.id).length
  const vB = matchup.votes.filter(v => v.locationId === matchup.locationB?.id).length
  const total = vA + vB
  const border = highlight ? 'border-gold-400 shadow-md' : isActive ? 'border-gold-300 shadow-sm' : 'border-gray-200'

  return (
    <div className={`border-2 ${border} rounded-lg overflow-hidden bg-white`}>
      <TeamSlot loc={matchup.locationA} votes={vA} total={total}
        isWinner={matchup.winner?.id === matchup.locationA?.id}
        isLoser={!!matchup.winner && matchup.winner.id !== matchup.locationA?.id}
        canVote={canVote && !!matchup.locationA && !!matchup.locationB && !matchup.winner}
        onClick={() => matchup.locationA && onVote(matchup.id, matchup.locationA.id)} voting={voting} />
      <div className={`border-t ${highlight || isActive ? 'border-gold-200' : 'border-gray-100'}`} />
      <TeamSlot loc={matchup.locationB} votes={vB} total={total}
        isWinner={matchup.winner?.id === matchup.locationB?.id}
        isLoser={!!matchup.winner && matchup.winner.id !== matchup.locationB?.id}
        canVote={canVote && !!matchup.locationA && !!matchup.locationB && !matchup.winner}
        onClick={() => matchup.locationB && onVote(matchup.id, matchup.locationB.id)} voting={voting} />
    </div>
  )
}

function TeamSlot({ loc, votes, total, isWinner, isLoser, canVote, onClick, voting }: {
  loc: BracketLocation | null; votes: number; total: number
  isWinner: boolean; isLoser: boolean; canVote: boolean; onClick: () => void; voting: boolean
}) {
  if (!loc) return <div className="px-2 py-2 bg-gray-50 h-8 flex items-center"><span className="text-[10px] text-gray-300">TBD</span></div>

  const pct = total > 0 ? Math.round((votes / total) * 100) : 0

  return (
    <button onClick={canVote ? onClick : undefined} disabled={!canVote || voting}
      className={`w-full px-2 py-1.5 flex items-center gap-1.5 text-left relative overflow-hidden transition-all ${
        isWinner ? 'bg-gold-50' : isLoser ? 'bg-gray-50 opacity-40' : canVote ? 'bg-white hover:bg-gold-50 cursor-pointer' : 'bg-white cursor-default'
      }`}>
      {total > 0 && <div className={`absolute inset-y-0 left-0 ${isWinner ? 'bg-gold-100/60' : 'bg-gray-100/60'}`} style={{ width: `${pct}%` }} />}
      <div className="relative flex items-center gap-1.5 w-full min-w-0">
        <div className="relative w-5 h-5 rounded-sm overflow-hidden flex-shrink-0 border border-gray-200">
          <Image src={loc.imageUrl} alt={loc.name} fill className="object-cover" sizes="20px" />
        </div>
        <span className={`text-[11px] font-bold truncate flex-1 ${isWinner ? 'text-navy-800' : 'text-gray-700'}`}>
          {isWinner && '\u2605 '}{loc.name}
        </span>
        <span className="text-[9px] text-gray-400 flex-shrink-0">{loc.avgRating.toFixed(1)}</span>
        {total > 0 && <span className="text-[9px] font-bold text-gray-500 flex-shrink-0 w-7 text-right">{pct}%</span>}
      </div>
    </button>
  )
}

