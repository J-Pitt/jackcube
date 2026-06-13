'use client'

import { motion } from 'framer-motion'

function initials(name) {
  if (!name) return '?'
  return name.trim().slice(0, 2).toUpperCase()
}

/**
 * Centerpiece "board" for Truth or Dare: every player is a token arranged in a
 * ring, with the active player enlarged, glowing, and tagged by a marker.
 * `children` renders in the middle of the ring (the cube / prompt status).
 */
export default function TurnBoard({ players = [], activeId, children }) {
  const count = Math.max(players.length, 1)
  const size = 460
  const center = size / 2
  const radius = 168

  return (
    <div
      className="relative mx-auto max-w-full"
      style={{ width: size, height: size }}
    >
      {/* outer board */}
      <div className="absolute inset-0 rounded-full border border-white/10 bg-cube-surface/40" />
      {/* token track */}
      <div
        className="absolute rounded-full border border-dashed border-white/10"
        style={{
          left: center - radius,
          top: center - radius,
          width: radius * 2,
          height: radius * 2,
        }}
      />

      {/* center status */}
      <div className="absolute inset-0 flex items-center justify-center px-16 text-center">
        {children}
      </div>

      {/* player tokens */}
      {players.map((p, i) => {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2
        const x = center + radius * Math.cos(angle)
        const y = center + radius * Math.sin(angle)
        const isActive = p.id === activeId
        const color = p.color || '#6C5CE7'

        return (
          <motion.div
            key={p.id}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ left: x, top: y }}
            animate={{ scale: isActive ? 1.16 : 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          >
            <div className="relative">
              {isActive && (
                <motion.span
                  initial={{ y: -4, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="absolute -top-6 left-1/2 -translate-x-1/2 text-lg"
                  style={{ color }}
                >
                  ▼
                </motion.span>
              )}
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full border-2 font-display text-lg font-black text-white"
                style={{
                  borderColor: color,
                  background: isActive ? color : 'rgba(255,255,255,0.04)',
                  boxShadow: isActive ? `0 0 24px ${color}` : 'none',
                  color: isActive ? '#0b0b13' : '#fff',
                }}
              >
                {initials(p.name)}
              </div>
            </div>
            <p
              className={`mt-1 max-w-[5rem] truncate text-xs font-semibold ${
                isActive ? 'text-white' : 'text-white/45'
              }`}
            >
              {p.name}
            </p>
          </motion.div>
        )
      })}
    </div>
  )
}
