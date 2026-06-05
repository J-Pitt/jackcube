export default function PlayerList({ players, hostId, myPlayerId }) {
  if (!players?.length) {
    return <p className="text-sm text-white/50">No players yet…</p>
  }

  return (
    <ul className="space-y-2">
      {players.map((player) => {
        const isMe = player.id === myPlayerId
        const isHost = player.id === hostId
        return (
          <li
            key={player.id}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
          >
            <span
              className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white/20"
              style={{ backgroundColor: player.color }}
              aria-hidden
            />
            <span className="flex-1 font-medium text-white">
              {player.name}
              {isMe && isHost ? (
                <span className="ml-2 text-xs text-cube-violet">(you · host)</span>
              ) : isMe ? (
                <span className="ml-2 text-xs text-white/50">(you)</span>
              ) : null}
            </span>
            {isHost && !isMe && (
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
