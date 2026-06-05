'use client'

import { motion } from 'framer-motion'

export default function FlappyController({ player, bird, onFlap, disabled }) {
  const alive = bird?.alive !== false
  const score = bird?.score ?? 0

  return (
    <main className="flex min-h-screen flex-col bg-cube-bg">
      <header
        className="px-4 py-3 text-center"
        style={{ borderBottom: `3px solid ${player?.color || '#6C5CE7'}` }}
      >
        <p className="text-xs uppercase tracking-widest text-white/40">Cube Flap</p>
        <p className="font-display text-xl font-bold text-white">{player?.name || 'Player'}</p>
        <p className="text-3xl font-bold text-cube-cyan">{score}</p>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
        {!alive ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <p className="text-5xl">💀</p>
            <p className="mt-4 text-xl font-bold text-cube-danger">Crashed!</p>
            <p className="mt-2 text-white/50">Score: {score} — watch the TV</p>
          </motion.div>
        ) : (
          <>
            <p className="text-center text-white/50">Tap to flap your bird</p>
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              disabled={disabled}
              onPointerDown={(e) => {
                e.preventDefault()
                onFlap()
              }}
              className="flex h-48 w-48 items-center justify-center rounded-full text-2xl font-bold text-cube-bg shadow-lg disabled:opacity-40"
              style={{
                background: `linear-gradient(135deg, ${player?.color || '#6C5CE7'}, #00F5D4)`,
                boxShadow: `0 0 40px ${player?.color || '#6C5CE7'}66`,
              }}
            >
              FLAP
            </motion.button>
          </>
        )}
      </div>

      <footer className="p-4 text-center text-xs text-white/30">
        {alive ? 'Hold phone in portrait · tap anywhere on the button' : 'Waiting for round to end…'}
      </footer>
    </main>
  )
}
