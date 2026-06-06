'use client'

import { useCallback, useState } from 'react'
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

const ACCENT_KEY = 'cardCrimes'

function fillBlank(text, parts) {
  const joined = (parts || []).join(' / ')
  if (!joined) return text
  if (text.includes('___')) return text.replace('___', joined)
  return `${text} ${joined}`
}

export default function CardCrimesHost({ room, roomId, hostId, refresh }) {
  const [nextLoading, setNextLoading] = useState(false)
  const phase = room?.phase
  const round = room?.gameState?.round ?? 1
  const cc = room?.gameState?.cardCrimes
  const players = room?.players || []
  const accent = getAccent(ACCENT_KEY)
  const judge = players.find((p) => p.id === cc?.judgeId)
  const submitters = players.filter((p) => p.id !== cc?.judgeId)
  const standings = players.some((p) => Number(p.score) > 0) ? players : undefined

  const countdown = useGameCountdown({ phase, round, roomId, hostId, onDone: refresh })

  useStepTimer({
    enabled: phase === 'playing' && !!cc?.endsAt,
    endsAt: cc?.endsAt,
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

  if (phase === 'leaderboard' || phase === 'victory') {
    return (
      <GameStage title="Card Crimes" emoji="🃏" accentKey={ACCENT_KEY} room={room} round={round} maxRounds={5}>
        <LeaderboardPhase
          room={room}
          onNextRound={handleNextRound}
          showNext={phase === 'leaderboard'}
          nextLoading={nextLoading}
        />
      </GameStage>
    )
  }

  const winner = cc?.winnerId ? players.find((p) => p.id === cc.winnerId) : null

  return (
    <GameStage title="Card Crimes" emoji="🃏" accentKey={ACCENT_KEY} room={room} round={round} maxRounds={5} standings={standings}>
      {phase === 'countdown' && <CountdownOverlay countdown={countdown} />}

      {phase === 'playing' && cc && (
        <PhaseReveal key={`${round}-${cc.step}`}>
          <div className="mb-6 flex justify-center">
            <div
              className="w-full max-w-xl rounded-3xl bg-[#0f1320] p-7 shadow-xl"
              style={{ border: `1px solid ${accent.hex}33` }}
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">Prompt</p>
              <p className="mt-2 font-display text-3xl font-extrabold leading-snug text-white">{cc.black?.text}</p>
            </div>
          </div>

          {cc.step === 'submit' && (
            <div className="space-y-6">
              <p className="text-center text-white/60">
                Judge <span style={{ color: judge?.color }}>{judge?.name}</span> waits while everyone plays a card.
              </p>
              <AnsweredTracker players={submitters} answeredIds={cc.answeredIds || []} accent={accent} label="played" />
              <div className="flex justify-center">
                <RingTimer endsAt={cc.endsAt} accent={accent} />
              </div>
            </div>
          )}

          {cc.step === 'judge' && (
            <div className="space-y-6">
              <p className="text-center text-sm font-bold uppercase tracking-widest text-white/40">
                Judge <span style={{ color: judge?.color }}>{judge?.name}</span> is choosing the winner…
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(cc.board || []).map((b, i) => (
                  <motion.div
                    key={b.sid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5"
                  >
                    <p className="text-lg font-medium text-white">{fillBlank(cc.black?.text, b.texts)}</p>
                  </motion.div>
                ))}
              </div>
              <div className="flex justify-center">
                <RingTimer endsAt={cc.endsAt} accent={accent} />
              </div>
            </div>
          )}

          {cc.step === 'reveal' && (
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-sm font-bold uppercase tracking-widest text-white/40">Winning card</p>
                {winner && (
                  <motion.p
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-1 font-display text-3xl font-black"
                    style={{ color: accent.hex }}
                  >
                    🏆 {winner.name}
                  </motion.p>
                )}
              </div>
              <div className="space-y-2">
                {(cc.board || []).map((b) => {
                  const author = b.authorId ? players.find((p) => p.id === b.authorId) : null
                  const isWinner = b.authorId && b.authorId === cc.winnerId
                  return (
                    <div
                      key={b.sid}
                      className="flex items-center justify-between gap-4 rounded-2xl border px-5 py-4"
                      style={{
                        borderColor: isWinner ? `${accent.hex}66` : 'rgba(255,255,255,0.1)',
                        background: isWinner ? `${accent.hex}12` : 'rgba(255,255,255,0.04)',
                      }}
                    >
                      <p className="font-medium text-white">{fillBlank(cc.black?.text, b.texts)}</p>
                      <span className="shrink-0 text-sm" style={{ color: isWinner ? accent.hex : author?.color }}>
                        {isWinner ? '🏆 ' : ''}{author?.name || '?'}
                      </span>
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
