'use client'

import { useEffect, useRef } from 'react'
import { FLAPPY } from '@/lib/flappyEngine'

export default function FlappyHostCanvas({ flappy, players, width = FLAPPY.WIDTH, height = FLAPPY.HEIGHT }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !flappy) return undefined
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    ctx.fillStyle = '#0d1117'
    ctx.fillRect(0, 0, width, height)

    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height)
    grad.addColorStop(0, '#1a1f35')
    grad.addColorStop(1, '#0a0b14')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)

    // Pipes
    for (const pipe of flappy.pipes || []) {
      const gapTop = pipe.gapCenter - FLAPPY.PIPE_GAP / 2
      const gapBot = pipe.gapCenter + FLAPPY.PIPE_GAP / 2
      ctx.fillStyle = '#00F5D4'
      ctx.fillRect(pipe.x, 0, FLAPPY.PIPE_W, gapTop)
      ctx.fillRect(pipe.x, gapBot, FLAPPY.PIPE_W, height - FLAPPY.GROUND_H - gapBot)
      ctx.fillStyle = '#6C5CE7'
      ctx.fillRect(pipe.x - 4, gapTop - 24, FLAPPY.PIPE_W + 8, 24)
      ctx.fillRect(pipe.x - 4, gapBot, FLAPPY.PIPE_W + 8, 24)
    }

    // Ground
    ctx.fillStyle = '#2d2a4a'
    ctx.fillRect(0, height - FLAPPY.GROUND_H, width, FLAPPY.GROUND_H)
    ctx.fillStyle = '#6C5CE7'
    ctx.fillRect(0, height - FLAPPY.GROUND_H, width, 4)

    // Birds
    const playerMap = Object.fromEntries((players || []).map((p) => [p.id, p]))
    for (const [id, bird] of Object.entries(flappy.birds || {})) {
      const player = playerMap[id]
      const x = FLAPPY.BIRD_X + ((players || []).findIndex((p) => p.id === id) % 4) * 8
      ctx.beginPath()
      ctx.arc(x, bird.y, FLAPPY.BIRD_R, 0, Math.PI * 2)
      ctx.fillStyle = player?.color || '#FFD93D'
      ctx.fill()
      ctx.strokeStyle = bird.alive ? '#fff' : '#FF6B6B'
      ctx.lineWidth = 2
      ctx.stroke()

      if (!bird.alive) {
        ctx.font = 'bold 16px system-ui'
        ctx.fillStyle = '#FF6B6B'
        ctx.fillText('💀', x - 8, bird.y + 6)
      }

      ctx.font = '600 11px system-ui'
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.fillText(player?.name?.slice(0, 8) || '?', x - 20, bird.y - FLAPPY.BIRD_R - 6)

      ctx.fillStyle = '#00F5D4'
      ctx.fillText(String(bird.score), x - 4, bird.y + FLAPPY.BIRD_R + 14)
    }
  }, [flappy, players, width, height])

  return (
    <canvas
      ref={canvasRef}
      className="w-full max-w-full rounded-2xl shadow-2xl shadow-cube-violet/20 ring-1 ring-white/10"
      style={{ aspectRatio: `${width}/${height}` }}
    />
  )
}
