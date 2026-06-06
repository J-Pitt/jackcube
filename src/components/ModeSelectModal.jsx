'use client'

import { motion, AnimatePresence } from 'framer-motion'

export default function ModeSelectModal({ open, title = 'How are you playing?', accent = '#00F5D4', onClose, onSelect }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-cube-surface p-7"
            style={{ boxShadow: `0 30px 80px -30px ${accent}66` }}
          >
            <h2 className="font-display text-2xl font-bold text-white">{title}</h2>
            <p className="mt-1 text-sm text-white/50">Pick how the room connects.</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onSelect('local')}
                className="group rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-cube-cyan/50 hover:bg-white/10 active:scale-[0.98]"
              >
                <span className="text-3xl">🏠</span>
                <span className="mt-3 block font-display text-lg font-bold text-white">Local party</span>
                <span className="text-sm text-white/50">Same room — TV + phones on WiFi</span>
              </button>

              <button
                type="button"
                onClick={() => onSelect('online')}
                className="group rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-cube-violet/50 hover:bg-white/10 active:scale-[0.98]"
              >
                <span className="text-3xl">🌐</span>
                <span className="mt-3 block font-display text-lg font-bold text-white">Online party</span>
                <span className="text-sm text-white/50">Friends anywhere — share a link</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full text-sm text-white/40 hover:text-white/70"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
