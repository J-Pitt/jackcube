'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/** Accent presets keyed by game; falls back to cyan. */
export const ACCENTS = {
  captionClash: { hex: '#00F5D4', glow: 'rgba(0,245,212,0.35)' },
  bluffBox: { hex: '#6C5CE7', glow: 'rgba(108,92,231,0.4)' },
  triviaToss: { hex: '#4ECDC4', glow: 'rgba(78,205,196,0.35)' },
  reactionRush: { hex: '#FF6B6B', glow: 'rgba(255,107,107,0.4)' },
  default: { hex: '#00F5D4', glow: 'rgba(0,245,212,0.35)' },
}

export function getAccent(key) {
  return ACCENTS[key] || ACCENTS.default
}

export function initials(name = '') {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  )
}

export function PlayerAvatar({ player, size = 44, answered = null, showName = false }) {
  const color = player?.color || '#6C5CE7'
  const dim = answered === false
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        layout
        animate={answered === true ? { scale: [1, 1.18, 1] } : {}}
        transition={{ duration: 0.4 }}
        className="relative flex items-center justify-center rounded-full font-display font-bold"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.38,
          color: dim ? 'rgba(255,255,255,0.4)' : '#0A0B14',
          background: dim ? 'rgba(255,255,255,0.08)' : color,
          boxShadow: answered === true ? `0 0 0 3px ${color}55, 0 4px 14px ${color}55` : 'none',
          opacity: dim ? 0.55 : 1,
        }}
      >
        {dim ? (
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>{initials(player?.name)}</span>
        ) : (
          initials(player?.name)
        )}
        {answered === true && (
          <span
            className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-cube-bg"
            style={{ background: color }}
          >
            ✓
          </span>
        )}
      </motion.div>
      {showName && (
        <span className="max-w-[64px] truncate text-xs text-white/60">{player?.name}</span>
      )}
    </div>
  )
}

/** Row of player avatars that light up as they act. Great for the TV. */
export function AnsweredTracker({ players = [], answeredIds = [], label = 'answered', accent }) {
  const set = new Set(answeredIds)
  const done = players.filter((p) => set.has(p.id)).length
  const total = players.length
  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/40">
        <span style={accent ? { color: accent.hex } : undefined}>{done}</span>
        <span>/ {total} {label}</span>
      </div>
      <div className="flex flex-wrap items-start justify-center gap-3">
        {players.map((p) => (
          <PlayerAvatar key={p.id} player={p} answered={set.has(p.id)} showName size={48} />
        ))}
      </div>
    </div>
  )
}

/** Self-calibrating circular countdown. */
export function RingTimer({ endsAt, accent, size = 84 }) {
  const [left, setLeft] = useState(0)
  const totalRef = useRef(0)

  useEffect(() => {
    totalRef.current = 0
    if (!endsAt) return undefined
    const tick = () => {
      const ms = Math.max(0, new Date(endsAt).getTime() - Date.now())
      const secs = ms / 1000
      if (secs > totalRef.current) totalRef.current = secs
      setLeft(secs)
    }
    tick()
    const id = setInterval(tick, 150)
    return () => clearInterval(id)
  }, [endsAt])

  if (!endsAt) return null
  const hex = accent?.hex || '#00F5D4'
  const r = size / 2 - 6
  const circ = 2 * Math.PI * r
  const pct = totalRef.current > 0 ? left / totalRef.current : 0
  const low = left <= 5
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={low ? '#FF6B6B' : hex}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.15s linear' }}
        />
      </svg>
      <span
        className="absolute font-display text-2xl font-black"
        style={{ color: low ? '#FF6B6B' : '#fff' }}
      >
        {Math.ceil(left)}
      </span>
    </div>
  )
}

/** Slim horizontal timer bar for compact spots. */
export function TimerBar({ endsAt, accent }) {
  const [left, setLeft] = useState(0)
  const totalRef = useRef(0)
  useEffect(() => {
    totalRef.current = 0
    if (!endsAt) return undefined
    const tick = () => {
      const secs = Math.max(0, (new Date(endsAt).getTime() - Date.now()) / 1000)
      if (secs > totalRef.current) totalRef.current = secs
      setLeft(secs)
    }
    tick()
    const id = setInterval(tick, 150)
    return () => clearInterval(id)
  }, [endsAt])
  if (!endsAt) return null
  const pct = totalRef.current > 0 ? (left / totalRef.current) * 100 : 0
  const low = left <= 5
  return (
    <div className="mx-auto h-2 w-full max-w-sm overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          background: low ? '#FF6B6B' : accent?.hex || '#00F5D4',
          transition: 'width 0.15s linear',
        }}
      />
    </div>
  )
}

function StageBackdrop({ accent }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        background: `radial-gradient(ellipse 80% 50% at 50% -10%, ${accent.glow} 0%, transparent 60%), radial-gradient(ellipse at bottom, #0a0b14 0%, #06070c 100%)`,
      }}
    />
  )
}

/** TV / main-screen wrapper with branded header. */
export function GameStage({ title, emoji, accentKey, room, round, maxRounds, children, headerRight }) {
  const accent = getAccent(accentKey)
  return (
    <main className="relative min-h-screen px-4 py-5 sm:px-6">
      <StageBackdrop accent={accent} />
      <header className="mx-auto mb-6 flex max-w-5xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-lg"
            style={{ background: `${accent.hex}1a`, boxShadow: `0 8px 24px ${accent.glow}` }}
          >
            {emoji}
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">JackCube</p>
            <h1 className="font-display text-2xl font-extrabold leading-tight text-white">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {round != null && (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70">
              Round {round}{maxRounds ? ` / ${maxRounds}` : ''}
            </span>
          )}
          {room?.gameCode && (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/50">
              Code <span className="font-bold" style={{ color: accent.hex }}>{room.gameCode}</span>
            </span>
          )}
          {headerRight}
        </div>
      </header>
      <div className="mx-auto max-w-5xl">{children}</div>
    </main>
  )
}

/** Phone wrapper with branded gradient + safe padding. */
export function PhoneStage({ title, emoji, accentKey, children, footer }) {
  const accent = getAccent(accentKey)
  return (
    <main className="relative flex min-h-screen flex-col px-5 pb-6 pt-5">
      <StageBackdrop accent={accent} />
      {(title || emoji) && (
        <div className="mb-4 flex items-center gap-2">
          {emoji && <span className="text-xl">{emoji}</span>}
          <p className="text-sm font-bold uppercase tracking-widest" style={{ color: accent.hex }}>
            {title}
          </p>
        </div>
      )}
      <div className="flex flex-1 flex-col">{children}</div>
      {footer}
    </main>
  )
}

/** Big prompt card used across games. */
export function PromptCard({ label, children, accentKey, className = '' }) {
  const accent = getAccent(accentKey)
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-cube-surface/80 p-7 backdrop-blur ${className}`}
      style={{ boxShadow: `0 20px 60px -30px ${accent.glow}` }}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: `linear-gradient(90deg, transparent, ${accent.hex}, transparent)` }}
      />
      {label && (
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/40">{label}</p>
      )}
      {children}
    </div>
  )
}

export function PrimaryButton({ children, accentKey, className = '', ...props }) {
  const accent = getAccent(accentKey)
  return (
    <button
      type="button"
      {...props}
      className={`w-full rounded-2xl px-5 py-4 font-display text-lg font-bold text-cube-bg transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      style={{ background: accent.hex, boxShadow: props.disabled ? 'none' : `0 10px 30px -10px ${accent.glow}` }}
    >
      {children}
    </button>
  )
}

export function GhostButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`w-full rounded-2xl border border-white/20 px-5 py-4 font-display text-lg font-bold text-white transition hover:bg-white/10 active:scale-[0.98] disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  )
}

/** Selectable option button (votes, trivia, guesses). */
export function ChoiceButton({ children, selected = false, locked = false, index, accentKey, className = '', ...props }) {
  const accent = getAccent(accentKey)
  return (
    <button
      type="button"
      {...props}
      className={`group flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left text-base transition active:scale-[0.99] disabled:cursor-not-allowed ${className}`}
      style={{
        borderColor: selected ? accent.hex : 'rgba(255,255,255,0.12)',
        background: selected ? `${accent.hex}1a` : 'rgba(255,255,255,0.04)',
        opacity: locked && !selected ? 0.5 : 1,
      }}
    >
      {index != null && (
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-display text-sm font-black"
          style={{ background: selected ? accent.hex : 'rgba(255,255,255,0.08)', color: selected ? '#0A0B14' : '#fff' }}
        >
          {index}
        </span>
      )}
      <span className="flex-1 font-medium text-white">{children}</span>
      {selected && <span style={{ color: accent.hex }}>✓</span>}
    </button>
  )
}

/** Centered waiting/idle screen for phones. */
export function WaitingCard({ emoji = '⏳', title = 'Hang tight…', subtitle, accentKey }) {
  const accent = getAccent(accentKey)
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        className="text-6xl"
        style={{ filter: `drop-shadow(0 8px 20px ${accent.glow})` }}
      >
        {emoji}
      </motion.div>
      <p className="mt-5 font-display text-2xl font-bold text-white">{title}</p>
      {subtitle && <p className="mt-2 max-w-xs text-sm text-white/50">{subtitle}</p>}
    </div>
  )
}

/** Submitted/locked confirmation badge for phones. */
export function LockedBadge({ children = 'Locked in', accentKey }) {
  const accent = getAccent(accentKey)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-4 flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 font-semibold"
      style={{ borderColor: `${accent.hex}55`, background: `${accent.hex}14`, color: accent.hex }}
    >
      <span>✓</span> {children}
    </motion.div>
  )
}

export function PhaseReveal({ children }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
