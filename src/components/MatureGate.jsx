'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'jackcube:mature-ok'

export function hasMatureConsent() {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(STORAGE_KEY) === '1'
}

export function setMatureConsent() {
  localStorage.setItem(STORAGE_KEY, '1')
}

export default function MatureGate({ children, required }) {
  const [ok, setOk] = useState(false)

  useEffect(() => {
    if (!required) {
      setOk(true)
      return
    }
    setOk(hasMatureConsent())
  }, [required])

  if (!required || ok) return children

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6">
      <div className="max-w-md rounded-2xl border border-cube-danger/40 bg-cube-surface p-8 text-center">
        <p className="text-sm uppercase tracking-widest text-cube-danger">18+ only</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-white">Mature content</h2>
        <p className="mt-4 text-sm text-white/60">
          This game includes adult party humor for consenting adults. Do not play in public
          or with minors.
        </p>
        <button
          type="button"
          onClick={() => {
            setMatureConsent()
            setOk(true)
          }}
          className="mt-6 w-full rounded-xl bg-cube-cyan py-3 font-bold text-cube-bg"
        >
          I am 18+ — continue
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="mt-3 w-full text-sm text-white/40 hover:text-white/70"
        >
          Go back
        </button>
      </div>
    </div>
  )
}
