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
  RingTimer,
  PhaseReveal,
  getAccent,
} from '@/components/game/GameUI'

function DrawingPreview({ strokes }) {
  const w = 640
  const h = 380
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mx-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0f1320]">
      {(strokes || []).map((stroke, i) => {
        if (!stroke?.points?.length) return null
        const d = stroke.points
          .map((pt, j) => `${j === 0 ? 'M' : 'L'} ${pt.x * (w / 400)} ${pt.y * (h / 256)}`)
          .join(' ')
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={stroke.color || '#fff'}
            strokeWidth={stroke.width || 4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )
      })}
    </svg>
  )
}

export default function DoodleHost({
  room,
  roomId,
  hostId,
  refresh,
  slotKey = 'doodle',
  accentKey = 'doodle',
  title = 'Doodle Dash',
  emoji = '✏️',
}) {
  const [nextLoading, setNextLoading] = useState(false)
  const phase = room?.phase
  const round = room?.gameState?.round ?? 1
  const dl = room?.gameState?.[slotKey]
  const players = room?.players || []
  const accent = getAccent(accentKey)
  const drawer = players.find((p) => p.id === dl?.drawerId)
  const guessers = players.filter((p) => p.id !== dl?.drawerId)
  const standings = players.some((p) => Number(p.score) > 0) ? players : undefined

  const countdown = useGameCountdown({ phase, round, roomId, hostId, onDone: refresh })

  useStepTimer({
    enabled: phase === 'playing' && !!dl?.endsAt,
    endsAt: dl?.endsAt,
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
      <GameStage title={title} emoji={emoji} accentKey={accentKey} room={room} round={round} maxRounds={5}>
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
    <GameStage title={title} emoji={emoji} accentKey={accentKey} room={room} round={round} maxRounds={5} standings={standings}>
      {phase === 'countdown' && <CountdownOverlay countdown={countdown} />}

      {phase === 'playing' && dl && (
        <PhaseReveal key={`${round}-${dl.step}`}>
          {dl.step === 'assign' && (
            <div className="flex flex-col items-center gap-6 py-10 text-center">
              <p className="font-display text-3xl text-white">
                <span style={{ color: drawer?.color }}>{drawer?.name}</span> is drawing…
              </p>
              <RingTimer endsAt={dl.endsAt} accent={accent} />
            </div>
          )}

          {(dl.step === 'draw' || dl.step === 'guess') && (
            <div className="space-y-5">
              <DrawingPreview strokes={dl.strokes} />
              <p className="text-center font-display text-lg text-white/70">
                {dl.step === 'draw'
                  ? `${drawer?.name || 'Someone'} is drawing — get ready to guess!`
                  : 'Type your guesses on your phones!'}
              </p>
              {dl.step === 'guess' && (
                <AnsweredTracker players={guessers} answeredIds={dl.answeredIds || []} accent={accent} label="guessed" />
              )}
              <div className="flex justify-center">
                <RingTimer endsAt={dl.endsAt} accent={accent} />
              </div>
            </div>
          )}

          {dl.step === 'reveal' && (
            <div className="space-y-5 text-center">
              <DrawingPreview strokes={dl.strokes} />
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-white/40">The word was</p>
                <motion.p
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-1 font-display text-4xl font-black"
                  style={{ color: accent.hex }}
                >
                  {dl.promptText}
                </motion.p>
              </div>
              <p className="text-white/60">
                Guessed it:{' '}
                <span style={{ color: accent.hex }}>
                  {(dl.correctGuessers || [])
                    .map((id) => players.find((p) => p.id === id)?.name)
                    .filter(Boolean)
                    .join(', ') || 'nobody'}
                </span>
              </p>
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
