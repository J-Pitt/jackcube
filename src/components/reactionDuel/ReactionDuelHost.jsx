'use client'

import ReactionHost from '@/components/reactionRush/ReactionHost'

export default function ReactionDuelHost(props) {
  return (
    <ReactionHost
      {...props}
      slotKey="reactionDuel"
      accentKey="reactionDuel"
      title="Reaction Duel"
      emoji="🎯"
    />
  )
}
