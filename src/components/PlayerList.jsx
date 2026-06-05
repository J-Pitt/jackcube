function initials(name = '') {
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

export default function PlayerList({ players, hostId, myPlayerId }) {
  if (!players?.length) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/40">
        No players yet — share the code to fill the room.
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {players.map((player) => {
        const isMe = player.id === myPlayerId
        const isHost = player.id === hostId
        const isAway = !!player.disconnectedAt
        return (
          <li
            key={player.id}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
              isAway ? 'border-white/5 bg-white/[0.02] opacity-60' : 'border-white/10 bg-white/5'
            }`}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold text-cube-bg"
              style={{ backgroundColor: player.color }}
              aria-hidden
            >
              {initials(player.name)}
            </span>
            <span className="flex-1 font-medium text-white">
              {player.name}
              {isMe && isHost ? (
                <span className="ml-2 text-xs text-cube-violet">(you · host)</span>
              ) : isMe ? (
                <span className="ml-2 text-xs text-white/50">(you)</span>
              ) : null}
            </span>
            {isAway && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/50">Away</span>
            )}
            {isHost && !isMe && !isAway && (
              <span className="rounded-full bg-cube-violet/30 px-2 py-0.5 text-xs font-semibold text-cube-violet">
                Host
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
