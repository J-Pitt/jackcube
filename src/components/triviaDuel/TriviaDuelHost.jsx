'use client'

import TriviaHost from '@/components/triviaToss/TriviaHost'

export default function TriviaDuelHost(props) {
  return (
    <TriviaHost
      {...props}
      slotKey="triviaDuel"
      accentKey="triviaDuel"
      title="Trivia Duel"
      emoji="⚔️"
    />
  )
}
