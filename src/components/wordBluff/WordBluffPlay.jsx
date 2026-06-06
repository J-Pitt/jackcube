'use client'

import BluffPlay from '@/components/bluffBox/BluffPlay'

export default function WordBluffPlay(props) {
  return (
    <BluffPlay
      {...props}
      slotKey="wordBluff"
      accentKey="wordBluff"
      title="Word Bluff"
      emoji="📖"
      countdownSubtitle="Invent a definition so good it fools everyone…"
      writePlaceholder="A believable fake definition…"
      maxLength={120}
    />
  )
}
