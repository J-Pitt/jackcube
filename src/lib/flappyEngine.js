export const FLAPPY = {
  WIDTH: 960,
  HEIGHT: 540,
  GRAVITY: 0.42,
  FLAP: -7.5,
  MAX_FALL: 10,
  PIPE_W: 70,
  PIPE_GAP: 150,
  PIPE_INTERVAL: 220,
  PIPE_SPEED: 3.2,
  BIRD_X: 120,
  BIRD_R: 14,
  GROUND_H: 48,
  ROUND_SEC: 45,
}

export function createInitialFlappyState(players) {
  const birds = {}
  const playable = FLAPPY.HEIGHT - FLAPPY.GROUND_H
  players.forEach((p, i) => {
    const laneY = (playable / (players.length + 1)) * (i + 1)
    birds[p.id] = {
      y: laneY,
      vy: 0,
      alive: true,
      score: 0,
    }
  })

  return {
    currentGame: 'flappy',
    pipes: spawnInitialPipes(),
    birds,
    flapQueue: [],
    scrollX: 0,
    startedAt: null,
    endsAt: null,
  }
}

function spawnInitialPipes() {
  const pipes = []
  for (let i = 0; i < 5; i++) {
    pipes.push(makePipe(FLAPPY.WIDTH + 180 + i * FLAPPY.PIPE_INTERVAL))
  }
  return pipes
}

function makePipe(x) {
  const minGap = 90
  const maxGap = FLAPPY.HEIGHT - FLAPPY.GROUND_H - FLAPPY.PIPE_GAP - 90
  const gapCenter = minGap + Math.random() * (maxGap - minGap)
  return {
    x,
    gapCenter,
    passed: {},
  }
}

export function applyFlaps(state, flapPlayerIds) {
  for (const id of flapPlayerIds) {
    const bird = state.birds[id]
    if (bird?.alive) bird.vy = FLAPPY.FLAP
  }
}

export function stepFlappy(state, dt = 1) {
  const next = {
    ...state,
    birds: { ...state.birds },
    pipes: state.pipes.map((p) => ({ ...p, passed: { ...p.passed } })),
  }

  for (const [id, bird] of Object.entries(next.birds)) {
    if (!bird.alive) continue
    let { y, vy, score } = bird
    vy = Math.min(FLAPPY.MAX_FALL, vy + FLAPPY.GRAVITY * dt)
    y += vy * dt

    if (y - FLAPPY.BIRD_R < 0) {
      y = FLAPPY.BIRD_R
      vy = 0
    }
    if (y + FLAPPY.BIRD_R > FLAPPY.HEIGHT - FLAPPY.GROUND_H) {
      bird.alive = false
    }

    for (const pipe of next.pipes) {
      const inX =
        FLAPPY.BIRD_X + FLAPPY.BIRD_R > pipe.x &&
        FLAPPY.BIRD_X - FLAPPY.BIRD_R < pipe.x + FLAPPY.PIPE_W
      if (inX) {
        const gapTop = pipe.gapCenter - FLAPPY.PIPE_GAP / 2
        const gapBot = pipe.gapCenter + FLAPPY.PIPE_GAP / 2
        if (y - FLAPPY.BIRD_R < gapTop || y + FLAPPY.BIRD_R > gapBot) {
          bird.alive = false
        }
      }
      if (!pipe.passed[id] && pipe.x + FLAPPY.PIPE_W < FLAPPY.BIRD_X - FLAPPY.BIRD_R) {
        pipe.passed[id] = true
        score += 1
      }
    }

    next.birds[id] = { y, vy, alive: bird.alive, score }
  }

  for (const pipe of next.pipes) {
    pipe.x -= FLAPPY.PIPE_SPEED * dt
  }

  while (next.pipes.length && next.pipes[0].x < -FLAPPY.PIPE_W - 20) {
    next.pipes.shift()
  }

  const last = next.pipes[next.pipes.length - 1]
  if (!last || last.x < FLAPPY.WIDTH - FLAPPY.PIPE_INTERVAL) {
    const spawnX = last ? last.x + FLAPPY.PIPE_INTERVAL : FLAPPY.WIDTH + 80
    next.pipes.push(makePipe(spawnX))
  }

  next.scrollX = (next.scrollX || 0) + FLAPPY.PIPE_SPEED * dt
  return next
}

export function allBirdsDead(state) {
  return Object.values(state.birds).every((b) => !b.alive)
}

export function roundScoresFromBirds(state) {
  const out = {}
  for (const [id, bird] of Object.entries(state.birds)) {
    out[id] = bird.score
  }
  return out
}
