'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'

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

export function LeaderboardPhase({ room, onNextRound, showNext = true }) {
  return (
    <motion.div key="lb" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Leaderboard3D
        results={room?.gameState?.roundResults}
        players={room?.players}
        targetScore={room?.config?.targetScore}
      />
      {showNext && (
        <button
          type="button"
          onClick={onNextRound}
          className="mt-6 w-full rounded-xl bg-cube-violet py-3 font-bold text-white hover:bg-cube-violet/90"
        >
          Next round →
        </button>
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
