import { NextResponse } from 'next/server'
import { getRoom, setRoom } from '../../../lib/redis'
import { endsIn, ROUND_MS } from '../../../lib/gameInit'
import { pickHostLine } from '../../../lib/content'
import { scoreFakinItRound } from '../../../lib/games/fakinItScoring'
import { scoreDirtyDrawfulRound } from '../../../lib/games/dirtyDrawfulScoring'
import { scoreLetMeFinishRound } from '../../../lib/games/letMeFinishScoring'
import { scoreTruthOrCubeRound } from '../../../lib/games/truthOrCubeScoring'
import { scoreRound, checkVictory } from '../../../lib/scoring'

export async function POST(request) {
  try {
    const { roomId, hostId, forceStep } = await request.json()
    if (!roomId || !hostId) {
      return NextResponse.json(
        { success: false, error: 'roomId and hostId required' },
        { status: 400 }
      )
    }

    const room = await getRoom(roomId)
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
    }

    if (room.hostId !== hostId) {
      return NextResponse.json({ success: false, error: 'Only host can advance' }, { status: 403 })
    }

    const gameId = room.config?.gameId || 'flappy'
    if (gameId === 'flappy') {
      return NextResponse.json({ success: false, error: 'Use flappy host loop' }, { status: 400 })
    }

    if (room.phase !== 'playing' && room.phase !== 'countdown') {
      return NextResponse.json({ success: false, error: 'Invalid phase' }, { status: 400 })
    }

    const gs = { ...room.gameState }
    const secrets = gs.secrets || {}

    if (room.phase === 'countdown') {
      room.phase = 'playing'
      room.gameState = gs
      room.updatedAt = new Date().toISOString()
      await setRoom(roomId, room)
      return NextResponse.json({ success: true, phase: room.phase, gameState: gs })
    }

    if (gameId === 'fakinIt' && gs.fakinIt) {
      const fi = { ...gs.fakinIt }
      const sec = secrets.fakinIt || {}

      if (forceStep) fi.step = forceStep
      else if (fi.step === 'prompt') {
        fi.step = 'action'
        fi.endsAt = endsIn(ROUND_MS.fakinIt.action)
      } else if (fi.step === 'action') {
        fi.step = 'vote'
        fi.endsAt = endsIn(ROUND_MS.fakinIt.vote)
      } else if (fi.step === 'vote') {
        fi.step = 'reveal'
        fi.promptText = sec.promptText
        fi.endsAt = endsIn(ROUND_MS.fakinIt.reveal)
      } else if (fi.step === 'reveal') {
        const roundScores = scoreFakinItRound(fi, room.players || [])
        const { results, updatedPlayers } = scoreRound(room.players || [], roundScores)
        room.players = updatedPlayers
        const winner = checkVictory(updatedPlayers, room.config?.targetScore ?? 5000)
        room.phase = winner ? 'victory' : 'leaderboard'
        room.gameState = { ...gs, fakinIt: fi, roundResults: results, winnerId: winner?.id || null }
        room.updatedAt = new Date().toISOString()
        await setRoom(roomId, room)
        return NextResponse.json({
          success: true,
          phase: room.phase,
          roundResults: results,
        })
      }
      gs.fakinIt = fi
    }

    if (gameId === 'dirtyDrawful' && gs.dirtyDrawful) {
      const dd = { ...gs.dirtyDrawful }
      const sec = secrets.dirtyDrawful || {}

      if (dd.step === 'assign') {
        dd.step = 'draw'
        dd.endsAt = endsIn(ROUND_MS.dirtyDrawful.draw)
        dd.hostLine = pickHostLine()?.text || dd.hostLine
      } else if (dd.step === 'draw') {
        dd.step = 'guess'
        dd.endsAt = endsIn(ROUND_MS.dirtyDrawful.guess)
      } else if (dd.step === 'guess') {
        const target = sec.promptText || ''
        const correctGuessers = []
        Object.entries(dd.guesses || {}).forEach(([pid, guess]) => {
          if (pid === dd.drawerId) return
          const g = String(guess).trim().toLowerCase()
          const t = String(target).trim().toLowerCase()
          if (g && (g === t || t.includes(g) || g.includes(t))) correctGuessers.push(pid)
        })
        dd.correctGuessers = correctGuessers
        dd.step = 'reveal'
        dd.promptText = target
        dd.endsAt = endsIn(ROUND_MS.dirtyDrawful.reveal)
      } else if (dd.step === 'reveal') {
        const roundScores = scoreDirtyDrawfulRound(
          { ...dd, promptText: sec.promptText || dd.promptText },
          room.players || []
        )
        const { results, updatedPlayers } = scoreRound(room.players || [], roundScores)
        room.players = updatedPlayers
        const winner = checkVictory(updatedPlayers, room.config?.targetScore ?? 5000)
        room.phase = winner ? 'victory' : 'leaderboard'
        room.gameState = { ...gs, dirtyDrawful: dd, roundResults: results, winnerId: winner?.id || null }
        room.updatedAt = new Date().toISOString()
        await setRoom(roomId, room)
        return NextResponse.json({ success: true, phase: room.phase, roundResults: results })
      }
      gs.dirtyDrawful = dd
    }

    if (gameId === 'truthOrCube' && gs.truthOrCube) {
      const toc = { ...gs.truthOrCube }
      const sec = secrets.truthOrCube || {}

      if (toc.step === 'cube') {
        toc.step = 'active'
        toc.endsAt = endsIn(ROUND_MS.truthOrCube.active)
      } else if (toc.step === 'active') {
        toc.step = 'reveal'
        toc.promptText = sec.promptText
        toc.endsAt = endsIn(ROUND_MS.truthOrCube.reveal)
      } else if (toc.step === 'reveal') {
        const roundScores = scoreTruthOrCubeRound(toc, room.players || [])
        const { results, updatedPlayers } = scoreRound(room.players || [], roundScores)
        room.players = updatedPlayers
        const winner = checkVictory(updatedPlayers, room.config?.targetScore ?? 5000)
        room.phase = winner ? 'victory' : 'leaderboard'
        room.gameState = {
          ...gs,
          truthOrCube: toc,
          roundResults: results,
          winnerId: winner?.id || null,
        }
        room.updatedAt = new Date().toISOString()
        await setRoom(roomId, room)
        return NextResponse.json({ success: true, phase: room.phase, roundResults: results })
      }
      gs.truthOrCube = toc
    }

    if (gameId === 'letMeFinish' && gs.letMeFinish) {
      const lmf = { ...gs.letMeFinish }

      if (lmf.step === 'question') {
        lmf.step = 'pitch'
        lmf.pitchStarted = true
        lmf.endsAt = endsIn(ROUND_MS.letMeFinish.pitch)
      } else if (lmf.step === 'pitch') {
        lmf.step = 'rebuttal'
        lmf.endsAt = endsIn(ROUND_MS.letMeFinish.rebuttal)
      } else if (lmf.step === 'rebuttal') {
        lmf.step = 'vote'
        lmf.endsAt = endsIn(ROUND_MS.letMeFinish.vote)
      } else if (lmf.step === 'vote') {
        lmf.step = 'reveal'
        lmf.endsAt = endsIn(ROUND_MS.letMeFinish.reveal)
      } else if (lmf.step === 'reveal') {
        const roundScores = scoreLetMeFinishRound(lmf, room.players || [])
        const { results, updatedPlayers } = scoreRound(room.players || [], roundScores)
        room.players = updatedPlayers
        const winner = checkVictory(updatedPlayers, room.config?.targetScore ?? 5000)
        room.phase = winner ? 'victory' : 'leaderboard'
        room.gameState = { ...gs, letMeFinish: lmf, roundResults: results, winnerId: winner?.id || null }
        room.updatedAt = new Date().toISOString()
        await setRoom(roomId, room)
        return NextResponse.json({ success: true, phase: room.phase, roundResults: results })
      }
      gs.letMeFinish = lmf
    }

    room.gameState = gs
    room.updatedAt = new Date().toISOString()
    await setRoom(roomId, room)

    return NextResponse.json({ success: true, phase: room.phase, gameState: gs })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Server error', details: err.message },
      { status: 500 }
    )
  }
}
