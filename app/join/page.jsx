'use client'

import Link from 'next/link'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { joinRoom } from '@/lib/roomApi'
import { getRejoinPath, saveRejoin } from '@/lib/rejoin'

function JoinForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefilledCode = searchParams.get('code') || ''

  const [code, setCode] = useState(prefilledCode.toUpperCase())
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await joinRoom(code, name.trim() || 'Player')
      const session = {
        roomId: data.roomId,
        gameCode: data.gameCode || code,
        playerId: data.myPlayerId,
        playerName: name.trim() || 'Player',
        isHost: data.isHost === true,
        mode: data.mode,
      }
      saveRejoin(session)
      router.push(getRejoinPath(session, data.phase || 'lobby'))
    } catch (err) {
      setError(err.message || 'Could not join room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <p className="text-sm uppercase tracking-widest text-cube-cyan">Join a party</p>
      <h1 className="font-display text-3xl font-bold text-white">Enter room code</h1>
      <p className="mt-2 text-sm text-white/50">
        Get the 4-letter code from the host screen or invite link. Use the same name to rejoin a
        game in progress.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <label className="block">
          <span className="text-sm text-white/60">Room code</span>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
            maxLength={4}
            placeholder="ABCD"
            required
            className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center font-display text-2xl tracking-[0.3em] text-cube-cyan placeholder:text-white/20"
          />
        </label>

        <label className="block">
          <span className="text-sm text-white/60">Your name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={16}
            placeholder="Player"
            required
            className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/30"
          />
        </label>

        {error && (
          <p className="text-sm text-cube-danger" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || code.length < 4}
          className="w-full rounded-xl bg-cube-cyan py-3 font-bold text-cube-bg hover:bg-cube-cyan/90 disabled:opacity-50"
        >
          {loading ? 'Joining…' : 'Join lobby'}
        </button>
      </form>

      <Link href="/" className="mt-8 text-center text-sm text-white/50 hover:text-white">
        ← Back home
      </Link>
    </main>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={<p className="p-8 text-white/60">Loading…</p>}>
      <JoinForm />
    </Suspense>
  )
}
