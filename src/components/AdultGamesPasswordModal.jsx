'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { setAdultUnlocked } from '@/lib/adultAccess'

export default function AdultGamesPasswordModal({ open, onClose, onUnlocked }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/jackcube/adult/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Incorrect password')
        return
      }
      setAdultUnlocked()
      setPassword('')
      onUnlocked?.()
      onClose()
    } catch {
      setError('Could not verify password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-cube-danger/30 bg-cube-surface p-8"
      >
        <p className="text-sm uppercase tracking-widest text-cube-danger">18+ Adult Games</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-white">Enter password</h2>
        <p className="mt-2 text-sm text-white/50">
          Mature party games are locked. Ask your host for the room password.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="Password"
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/30"
          />
          {error && (
            <p className="text-sm text-cube-danger" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-xl bg-cube-danger py-3 font-bold text-white disabled:opacity-40"
          >
            {loading ? 'Checking…' : 'Unlock adult games'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full text-sm text-white/40 hover:text-white/70"
          >
            Cancel
          </button>
        </form>
      </motion.div>
    </div>
  )
}
