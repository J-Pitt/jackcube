'use client'

import { motion } from 'framer-motion'
import {
  PhoneStage,
  PromptCard,
  Scoreboard,
  getAccent,
} from '@/components/game/GameUI'
import { GoHomeButton } from '@/components/PartyGameLayout'
import { useCountUp } from '@/hooks/useCountUp'
import { computeStandings, movementMessage } from '@/lib/standings'
import ConfettiBurst from '@/components/results/ConfettiBurst'

function MovementBadge({ movement, delta }) {
  if (movement === 'up') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#43F8B0]/15 px-2.5 py-1 text-xs font-bold text-[#43F8B0]">
        ▲ +{delta}
      </span>
    )
  }
  if (movement === 'down') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-cube-danger/15 px-2.5 py-1 text-xs font-bold text-cube-danger">
        ▼ {delta}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2.5 py-1 text-xs font-bold text-white/50">
      — held
    </span>
  )
}

export default function PlayerResultsScreen({ room, playerId, phase, accentKey }) {
  const results = room?.gameState?.roundResults || []
  const players = room?.players || []
  const targetScore = room?.config?.targetScore
  const winnerId = room?.gameState?.winnerId
  const isVictory = phase === 'victory'
  const accent = getAccent(accentKey)

  const { standings } = computeStandings(players, results, { winnerId })
  const me = standings.find((s) => s.id === playerId)
  const myRank = me?.rank ?? null
  const iWon = isVictory && winnerId === playerId

  const total = useCountUp(me?.currentTotal ?? 0, {
    from: me?.previousTotal ?? 0,
    duration: 1.2,
    delay: 0.25,
  })
  const earned = useCountUp(me?.pointsEarned ?? 0, { from: 0, duration: 0.9, delay: 0.15 })

  const headline = isVictory
    ? iWon
      ? 'You win!'
      : 'Game over'
    : movementMessage(me)

  return (
    <PhoneStage
      title={isVictory ? 'Game over' : 'Round over'}
      emoji={isVictory ? (iWon ? '🏆' : '🏁') : '📊'}
      accentKey={accentKey}
    >
      {iWon && <ConfettiBurst active intensity={1.2} />}

      <PromptCard accentKey={accentKey} className="overflow-hidden text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-white/40">
          {isVictory ? (iWon ? 'Champion' : 'Final standing') : 'Your placement'}
        </p>

        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.05 }}
          className="mt-2 flex items-center justify-center gap-3"
        >
          <span className="font-display text-6xl font-black text-white">
            {myRank ? `#${myRank}` : '—'}
          </span>
          {!isVictory && me ? <MovementBadge movement={me.movement} delta={me.delta} /> : null}
        </motion.div>

        {headline ? (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-2 font-display text-lg font-bold"
            style={{ color: accent.hex }}
          >
            {headline}
          </motion.p>
        ) : null}

        {me?.pointsEarned ? (
          <p className="mt-3 font-display text-2xl font-black tabular-nums" style={{ color: accent.hex }}>
            +{earned.toLocaleString()}
            <span className="ml-1 text-sm font-semibold text-white/40">pts this round</span>
          </p>
        ) : null}

        <p className="mt-2 text-sm text-white/50">
          Total{' '}
          <strong className="font-display tabular-nums text-white">{total.toLocaleString()}</strong>
        </p>
      </PromptCard>

      <div className="mt-5 flex-1">
        <Scoreboard
          players={players}
          results={results}
          targetScore={targetScore}
          accentKey={accentKey}
        />
      </div>

      {isVictory ? (
        <div className="mt-6">
          <GoHomeButton />
        </div>
      ) : (
        <p className="mt-6 text-center text-sm text-white/40">
          Next round starting on the main screen…
        </p>
      )}
    </PhoneStage>
  )
}
