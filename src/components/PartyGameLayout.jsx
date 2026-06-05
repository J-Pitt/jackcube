'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { clearRejoin } from '@/lib/rejoin'

const Leaderboard3D = dynamic(() => import('@/components/leaderboard/Leaderboard3D'), {
  ssr: false,
  loading: () => <p className="text-white/50">Loading leaderboard…</p>,
})

export function CountdownOverlay({ countdown }) {
  if (countdown == null) return null
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-48 items-center justify-center"
    >
      <span className="font-display text-8xl font-black text-cube-cyan">
        {countdown > 0 ? countdown : 'GO!'}
      </span>
    </motion.div>
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
  return (
    <p className="text-lg text-cube-cyan">
      {label} <span className="font-mono font-bold">{left}s</span>
    </p>
  )
}

export function GoHomeButton({ className = '' }) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => {
        clearRejoin()
        router.push('/')
      }}
      className={`w-full rounded-xl border border-white/20 py-3 font-bold text-white transition hover:bg-white/10 ${className}`}
    >
      Back to home
    </button>
  )
}

export function LeaderboardPhase({ room, onNextRound, showNext = true, nextLoading = false }) {
  const isVictory = !showNext
  const winner = room?.players?.find((p) => p.id === room?.gameState?.winnerId)

  return (
    <motion.div key="lb" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Leaderboard3D
        results={room?.gameState?.roundResults}
        players={room?.players}
        targetScore={room?.config?.targetScore}
      />
      {isVictory && winner && (
        <p className="mt-6 text-center font-display text-3xl font-bold text-cube-cyan">
          {winner.name} wins!
        </p>
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
        <p className="text-xs uppercase tracking-widest text-cube-violet">JackCube</p>
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
