'use client'

import ReactionPlay from '@/components/reactionRush/ReactionPlay'

export default function ReactionDuelPlay(props) {
  return (
    <ReactionPlay
      {...props}
      slotKey="reactionDuel"
      accentKey="reactionDuel"
      title="Reaction Duel"
      emoji="🎯"
    />
  )
}
