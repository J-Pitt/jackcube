# JackCube

Multiplayer party game — **TV/main screen for the show**, **phones as private controllers**. Supports **online** (remote friends) and **local** (same-room WiFi) modes.

Built for **AWS Amplify** (Next.js API routes + Upstash Redis).

## Quick start

```bash
cd ~/jackcube
cp env.example .env.local
# Add UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
npm install
npm run dev
```

Open [http://localhost:5180](http://localhost:5180)

## Party games (2–5 players)

Jackbox & Mario Party-inspired games — pick from [/games](http://localhost:5180/games) or the lobby:

| Game | ID | Players | TV | Phone |
|------|-----|---------|-----|-------|
| Caption Clash | `captionClash` | 2–5 | Prompt, answers, votes | Write + vote (Quiplash-style) |
| Bluff Box | `bluffBox` | 2–5 | Fill-in-blank, reveal | Submit bluffs + guess truth (Fibbage-style) |
| Trivia Toss | `triviaToss` | 2–5 | Question + reveal | Multiple-choice trivia (50+ Q bank) |
| Reaction Rush | `reactionRush` | 2–5 | WAIT… GO! | Reflex tap mini-game |
| Categories | `categories` | 2–5 | Letter + 3 categories, score grid | Type answers fast (Scattergories-style) |
| Doodle Dash | `doodle` | 3–5 | Live drawing + reveal | One draws, everyone guesses (Pictionary-style) |
| Word Bluff | `wordBluff` | 2–5 | Obscure word + reveal | Fake a definition, spot the real one (Balderdash-style) |

### Open content / licensing

New games reuse openly-licensed inspiration. Content is bundled as JSON decks under `src/content/decks/`:

- **Trivia Toss** — general-knowledge bank inspired by the [Open Trivia Database](https://opentdb.com) (CC BY-SA 4.0); questions authored for Party Cube.
- **Doodle Dash** — family word list inspired by open word lists ([wordnik/wordlist](https://github.com/wordnik/wordlist) MIT, [pandaqi/pq-words](https://github.com/pandaqi/pq-words) MIT).
- **Word Bluff** — obscure-word definitions authored for Party Cube.

## 18+ mature games

Adult party games ship with curated JSON prompt decks under `src/content/decks/`. Password-locked on the home screen. Set `ADULT_GAMES_PASSWORD` on the server (default dev password: `cube18`).

| Game | ID | Players |
|------|-----|---------|
| Truth or Cube | `truthOrCube` | 2–8 |
| Fakin' It All Night Long | `fakinIt` | 3–8 |
| Dirty Drawful | `dirtyDrawful` | 3–8 |
| Let Me Finish | `letMeFinish` | 3–8 |
| Would You Rather | `wouldYouRather` | 2–8 |
| Never Have I Ever | `neverHaveIEver` | 2–8 |
| Card Crimes | `cardCrimes` | 3–5 |

Adult content sources (all decks authored in-house, under `src/content/decks/`):

- **Would You Rather / Never Have I Ever** — spicy prompts inspired by the MIT-licensed [party-game-sentences](https://github.com/itsbrunodev/party-game-sentences) and [TalkShitGetDared](https://github.com/kyrexiii/TalkShitGetDared).
- **Card Crimes** — original fill-in cards. To use real Cards Against Humanity content, drop in [crhallberg/json-against-humanity](https://github.com/crhallberg/json-against-humanity) (**CC BY-NC-SA 4.0** — free, non-commercial, share-alike, with credit only).

**Consent:** Mature games show an 18+ gate before lobby/play.

**Privacy:** Secret prompts are stored in `gameState.secrets` and exposed via `GET /api/jackcube/room/me`.

## Flow

1. **Home** — pick Local/Online party, browse **Party games**, or unlock **Adult games**
2. **Host** — create room, get QR + 4-letter code
3. **Join** — `/join?code=ABCD` on phones
4. **Lobby** — pick game, player list, optional WebRTC video, host starts
5. **Game** — `/game` on TV, `/play` on phones (3-2-1 countdown, rounds, scoring)
6. **Leaderboard** — after each round; first to target score wins (5 rounds for party games)

## Lobby video call

WebRTC via PeerJS (hub-and-spoke: phones publish to TV). Optional — separate from game sync.

## API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/jackcube/room` | GET | Poll room state (sanitized) |
| `/api/jackcube/room` | POST | Create room / host sync state |
| `/api/jackcube/room/me` | GET | Private per-player view |
| `/api/jackcube/room/config` | POST | Host: gameId, spicyRemote, targetScore |
| `/api/jackcube/room/join` | POST | Join by code |
| `/api/jackcube/room/start` | POST | Host starts game |
| `/api/jackcube/room/input` | POST | Phone actions (vote, draw, tap, etc.) |
| `/api/jackcube/room/advance` | POST | Host advances party-game steps |
| `/api/jackcube/room/next-round` | POST | Host starts next round |

Redis key prefix: `jackcube:`

## Amplify deploy

Set `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and `NEXT_PUBLIC_APP_URL` in the Amplify console. See `amplify.yml`.
