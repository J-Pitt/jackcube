'use client'

import { useCallback, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { advanceGame, nextRound } from '@/lib/roomApi'
import { useStepTimer } from '@/hooks/useStepTimer'
import { useGameCountdown } from '@/hooks/useGameCountdown'
import { CountdownOverlay, LeaderboardPhase } from '@/components/PartyGameLayout'
import {
  AnsweredTracker,
  GameStage,
  PromptCard,
  RingTimer,
  PhaseReveal,
  getAccent,
} from '@/components/game/GameUI'

const ACCENT_KEY = 'categories'

function normalize(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
}

export default function CategoriesHost({ room, roomId, hostId, refresh }) {
  const [nextLoading, setNextLoading] = useState(false)
  const phase = room?.phase
  const round = room?.gameState?.round ?? 1
  const cat = room?.gameState?.categories
  const players = room?.players || []
  const accent = getAccent(ACCENT_KEY)
  const standings = players.some((p) => Number(p.score) > 0) ? players : undefined

  const countdown = useGameCountdown({ phase, round, roomId, hostId, onDone: refresh })

  useStepTimer({
    enabled: phase === 'playing' && !!cat?.endsAt,
    endsAt: cat?.endsAt,
    roomId,
    hostId,
    onAdvanced: () => refresh(),
  })

  const handleNextRound = useCallback(async () => {
    if (nextLoading) return
    setNextLoading(true)
    try {
      await nextRound(roomId, hostId)
      refresh()
    } finally {
      setNextLoading(false)
    }
  }, [roomId, hostId, refresh, nextLoading])

  const handleForceAdvance = useCallback(async () => {
    await advanceGame(roomId, hostId)
    refresh()
  }, [roomId, hostId, refresh])

  const target = (cat?.letter || '').trim().toLowerCase()
  const uniqueness = useMemo(() => {
    const counts = (cat?.categories || []).map(() => ({}))
    players.forEach((p) => {
      const ans = cat?.answers?.[p.id] || []
      ans.forEach((a, slot) => {
        const n = normalize(a)
        if (n && n[0] === target) counts[slot][n] = (counts[slot][n] || 0) + 1
      })
    })
    return counts
  }, [cat?.answers, cat?.categories, players, target])

  if (phase === 'leaderboard' || phase === 'victory') {
    return (
      <GameStage title="Categories" emoji="🔤" accentKey={ACCENT_KEY} room={room} round={round} maxRounds={5}>
        <LeaderboardPhase
          room={room}
          onNextRound={handleNextRound}
          showNext={phase === 'leaderboard'}
          nextLoading={nextLoading}
        />
      </GameStage>
    )
  }

  return (
    <GameStage title="Categories" emoji="🔤" accentKey={ACCENT_KEY} room={room} round={round} maxRounds={5} standings={standings}>
      {phase === 'countdown' && <CountdownOverlay countdown={countdown} />}

      {phase === 'playing' && cat && (
        <PhaseReveal key={`${round}-${cat.step}`}>
          {cat.step === 'write' && (
            <div className="space-y-8">
              <div className="text-center">
                <p className="text-sm font-bold uppercase tracking-widest text-white/40">Every answer must start with</p>
                <motion.p
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mx-auto mt-3 flex h-28 w-28 items-center justify-center rounded-3xl font-display text-7xl font-black text-cube-bg"
                  style={{ background: accent.hex, boxShadow: `0 16px 50px -10px ${accent.glow}` }}
                >
                  {cat.letter}
                </motion.p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {(cat.categories || []).map((c, i) => (
                  <PromptCard key={i} accentKey={ACCENT_KEY} className="text-center">
                    <p className="font-display text-xl font-bold text-white">{c}</p>
                  </PromptCard>
                ))}
              </div>
              <AnsweredTracker players={players} answeredIds={cat.answeredIds || []} accent={accent} label="locked in" />
              <div className="flex justify-center">
                <RingTimer endsAt={cat.endsAt} accent={accent} />
              </div>
            </div>
          )}

          {cat.step === 'reveal' && (
            <div className="space-y-4">
              <p className="text-center text-sm font-bold uppercase tracking-widest text-white/40">
                Letter <span style={{ color: accent.hex }}>{cat.letter}</span> · unique answers score double
              </p>
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <div className="grid grid-cols-[120px_repeat(3,1fr)] bg-white/5 text-xs font-bold uppercase tracking-widest text-white/40">
                  <span className="px-3 py-2">Player</span>
                  {(cat.categories || []).map((c, i) => (
                    <span key={i} className="px-3 py-2">{c}</span>
                  ))}
                </div>
                {players.map((p) => {
                  const ans = cat.answers?.[p.id] || []
                  return (
                    <div key={p.id} className="grid grid-cols-[120px_repeat(3,1fr)] border-t border-white/5 text-sm">
                      <span className="truncate px-3 py-2 font-semibold" style={{ color: p.color }}>{p.name}</span>
                      {(cat.categories || []).map((_, slot) => {
                        const raw = ans[slot] || ''
                        const n = normalize(raw)
                        const valid = n && n[0] === target
                        const unique = valid && uniqueness[slot]?.[n] === 1
                        return (
                          <span
                            key={slot}
                            className="px-3 py-2"
                            style={{ color: valid ? (unique ? accent.hex : '#fff') : 'rgba(255,255,255,0.3)' }}
                          >
                            {raw || '—'}
                            {valid && <span className="ml-1 text-xs">{unique ? '★' : '✓'}</span>}
                          </span>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-10 text-center">
            <button type="button" onClick={handleForceAdvance} className="text-xs text-white/25 hover:text-white/50">
              Host: skip →
            </button>
          </div>
        </PhaseReveal>
      )}
    </GameStage>
  )
}
