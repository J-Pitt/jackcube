'use client'

import BluffHost from '@/components/bluffBox/BluffHost'

export default function WordBluffHost(props) {
  return (
    <BluffHost
      {...props}
      slotKey="wordBluff"
      accentKey="wordBluff"
      title="Word Bluff"
      emoji="📖"
      writeLabel="Invent a fake definition on your phone"
    />
  )
}
