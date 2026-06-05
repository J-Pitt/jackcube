const FLAPPY = {
  WIDTH: 960,
  HEIGHT: 540,
  PIPE_W: 70,
  PIPE_GAP: 150,
  PIPE_INTERVAL: 220,
  GROUND_H: 48,
}

function makePipe(x) {
  const minGap = 90
  const maxGap = FLAPPY.HEIGHT - FLAPPY.GROUND_H - FLAPPY.PIPE_GAP - 90
  const gapCenter = minGap + Math.random() * (maxGap - minGap)
  return { x, gapCenter, passed: {} }
}

function spawnInitialPipes() {
  const pipes = []
  for (let i = 0; i < 5; i++) {
    pipes.push(makePipe(FLAPPY.WIDTH + 180 + i * FLAPPY.PIPE_INTERVAL))
  }
  return pipes
}

function createInitialFlappyState(players) {
  const birds = {}
  const playable = FLAPPY.HEIGHT - FLAPPY.GROUND_H
  players.forEach((p, i) => {
    birds[p.id] = {
      y: (playable / (players.length + 1)) * (i + 1),
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

export { createInitialFlappyState }
