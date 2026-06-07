'use client'

import TriviaPlay from '@/components/triviaToss/TriviaPlay'

export default function TriviaDuelPlay(props) {
  return (
    <TriviaPlay
      {...props}
      slotKey="triviaDuel"
      accentKey="triviaDuel"
      title="Trivia Duel"
      emoji="⚔️"
    />
  )
}
