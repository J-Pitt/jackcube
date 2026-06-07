'use client'

import { Scoreboard } from '@/components/game/GameUI'
import Podium3D from './Podium3D'
import VictoryScene from './VictoryScene'

/**
 * Orchestrates the TV/host results view.
 * - Between rounds (`isVictory` false): animated podium of the top 3.
 * - Game over (`isVictory` true): full champion celebration with confetti.
 *
 * The 2D <Scoreboard> stays below the canvas as the complete, reliable
 * standings list (and covers players beyond the top 3).
 */
export default function Leaderboard3D({
  results,
  players,
  targetScore,
  accentKey,
  isVictory = false,
  winnerId = null,
  className = '',
}) {
  return (
    <div className={`relative ${className}`}>
      <div className="h-[460px] w-full overflow-hidden rounded-2xl ring-1 ring-white/10">
        {isVictory ? (
          <VictoryScene
            players={players}
            results={results}
            winnerId={winnerId}
            accentKey={accentKey}
          />
        ) : (
          <Podium3D
            players={players}
            results={results}
            targetScore={targetScore}
            accentKey={accentKey}
          />
        )}
      </div>

      <div className="mt-4">
        <Scoreboard players={players} results={results} targetScore={targetScore} accentKey={accentKey} />
      </div>
    </div>
  )
}
