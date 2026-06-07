'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useLeaveGame } from '@/hooks/useLeaveGame'
import ConfettiBurst from '@/components/results/ConfettiBurst'
import { getAccent } from '@/components/game/GameUI'

const Leaderboard3D = dynamic(() => import('@/components/leaderboard/Leaderboard3D'), {
  ssr: false,
  loading: () => <p className="text-white/50">Loading leaderboard…</p>,
})

export function CountdownOverlay({ countdown }) {
  if (countdown == null) return null
  const isGo = countdown <= 0
  return (
    <div className="flex h-64 items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={countdown}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative"
        >
          <span
            className="font-display text-[9rem] font-black leading-none"
            style={{
              color: isGo ? '#00F5D4' : '#fff',
              textShadow: isGo
                ? '0 0 40px rgba(0,245,212,0.6)'
                : '0 0 30px rgba(108,92,231,0.5)',
            }}
          >
            {isGo ? 'GO!' : countdown}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export function PhaseTimer({ endsAt, label }) {
  const [left, setLeft] = useState(0)
  useEffect(() => {
    if (!endsAt) return undefined
    const tick = () => {
      const ms = Math.max(0, new Date(endsAt).getTime() - Date.now())
      setLeft(Math.ceil(ms / 1000))
    }
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [endsAt])
  if (!endsAt) return null
  const low = left <= 5
  return (
    <div className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-widest">
      <span className="text-white/40">{label}</span>
      <span
        className="font-display text-lg font-black tabular-nums"
        style={{ color: low ? '#FF6B6B' : '#00F5D4' }}
      >
        {left}s
      </span>
    </div>
  )
}

export function GoHomeButton({ className = '' }) {
  const leaveGame = useLeaveGame()

  return (
    <button
      type="button"
      onClick={leaveGame}
      className={`w-full rounded-xl border border-white/20 py-3 font-bold text-white transition hover:bg-white/10 ${className}`}
    >
      Leave game
    </button>
  )
}

export function LeaderboardPhase({ room, onNextRound, showNext = true, nextLoading = false }) {
  const isVictory = !showNext
  const winnerId = room?.gameState?.winnerId
  const winner = room?.players?.find((p) => p.id === winnerId)
  const accent = getAccent(room?.config?.gameId)

  return (
    <motion.div key="lb" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {isVictory && (
        <ConfettiBurst
          active
          duration={4200}
          intensity={1.4}
          colors={[accent.hex, '#6C5CE7', '#FF6B6B', '#FFD166', '#ffffff']}
        />
      )}
      <Leaderboard3D
        results={room?.gameState?.roundResults}
        players={room?.players}
        targetScore={room?.config?.targetScore}
        accentKey={room?.config?.gameId}
        isVictory={isVictory}
        winnerId={winnerId}
      />
      {isVictory && winner && (
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 18 }}
          className="mt-6 text-center font-display text-3xl font-bold"
          style={{ color: accent.hex }}
        >
          {winner.name} wins!
        </motion.p>
      )}
      {showNext ? (
        <button
          type="button"
          onClick={onNextRound}
          disabled={nextLoading}
          className="mt-6 w-full rounded-xl bg-cube-violet py-3 font-bold text-white hover:bg-cube-violet/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {nextLoading ? 'Starting…' : 'Next round →'}
        </button>
      ) : (
        <GoHomeButton className="mt-6" />
      )}
    </motion.div>
  )
}

export function GameHeader({ title, room, subtitle }) {
  return (
    <header className="mx-auto mb-4 flex max-w-5xl items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-widest text-cube-violet">Party Cube</p>
        <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-white/40">{subtitle}</p>}
      </div>
      <div className="text-right text-sm text-white/50">
        Code: <span className="font-bold text-cube-cyan">{room?.gameCode}</span>
      </div>
    </header>
  )
}

export function AnimatePhase({ phaseKey, children }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div key={phaseKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
