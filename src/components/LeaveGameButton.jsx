'use client'

import { useLeaveGame } from '@/hooks/useLeaveGame'

export default function LeaveGameButton({
  className = '',
  label = 'Leave game',
  compact = false,
}) {
  const leaveGame = useLeaveGame()

  return (
    <button
      type="button"
      onClick={leaveGame}
      className={
        className ||
        `rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 ${
          compact ? '' : 'w-full'
        }`
      }
    >
      {label}
    </button>
  )
}
