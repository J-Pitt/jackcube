'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { PARTY_GAMES } from '@/lib/games/registry'
import { getAccent } from '@/components/game/GameUI'

export default function GamesPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <Link href="/" className="text-sm text-white/40 transition hover:text-cube-cyan">
        ← Back home
      </Link>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
        <h1 className="font-display text-4xl font-extrabold text-white">Party games</h1>
        <p className="mt-2 text-white/50">
          Jackbox &amp; Mario Party vibes — 2–5 players, phones as controllers, TV as the show.
        </p>
      </motion.div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {PARTY_GAMES.map((g, i) => {
          const accent = getAccent(g.id)
          return (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-cube-surface/70 p-6"
              style={{ boxShadow: `0 24px 60px -40px ${accent.glow}` }}
            >
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: `linear-gradient(90deg, transparent, ${accent.hex}, transparent)` }}
              />
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
                style={{ background: `${accent.hex}1a`, boxShadow: `0 8px 24px ${accent.glow}` }}
              >
                {g.emoji}
              </span>
              <h2 className="mt-4 font-display text-2xl font-bold text-white">{g.name}</h2>
              <p className="mt-1 min-h-[40px] text-sm text-white/50">{g.description}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-white/30">
                {g.minPlayers}–{g.maxPlayers} players · {g.maxRounds} rounds
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/host?mode=local&gameId=${g.id}`}
                  className="rounded-xl px-4 py-2.5 text-sm font-bold text-cube-bg transition active:scale-95"
                  style={{ background: accent.hex }}
                >
                  Host local
                </Link>
                <Link
                  href={`/host?mode=online&gameId=${g.id}`}
                  className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Host online
                </Link>
              </div>
            </motion.div>
          )
        })}
      </div>

      <Link
        href="/join"
        className="mt-8 block text-center text-sm text-white/50 underline-offset-4 hover:text-cube-cyan hover:underline"
      >
        Joining a game instead? Enter a room code →
      </Link>
    </main>
  )
}
